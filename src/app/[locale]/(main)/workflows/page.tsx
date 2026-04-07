"use client";
import React, { useState } from "react";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiFlowChart,
  RiLoader4Line,
  RiSettings3Line,
} from "react-icons/ri";
import WorkflowEditor from "@/components/workflow/WorkflowEditor";
import WorkflowSetupModal from "@/components/workflow/WorkflowSetupModal";
import WorkflowSettingsModal from "@/components/workflow/WorkflowSettingsModal";
import { Workflow } from "@/types/team";
import {
  useWorkflows,
  useCreateWorkflow,
  useDeleteWorkflow,
  useWorkflowStats,
  useUpdateWorkflowJson,
} from "@/hooks/useWorkflowApi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";
import { WorkflowResponse } from "@/lib/fetchers/workflow";

export default function Workflows() {
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "editor">("list");
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] =
    useState<WorkflowResponse | null>(null);
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);

  // 获取当前工作空间
  const { currentWorkspace } = useWorkspace();

  // MARK: 获取工作流数据
  const {
    data: workflows = [],
    isLoading,
    error,
  } = useWorkflows(currentWorkspace?.id);
  const { stats } = useWorkflowStats(currentWorkspace?.id);

  // MARK: 变更操作
  const createWorkflowMutation = useCreateWorkflow();
  const deleteWorkflowMutation = useDeleteWorkflow();
  const updateWorkflowJsonMutation = useUpdateWorkflowJson();

  const handleCreateNew = () => {
    setEditingWorkflow(null);
    setIsSetupModalOpen(true);
  };

  // MARK: 创建工作流
  const handleSetupContinue = async (workflowInfo: {
    name: string;
    description: string;
  }) => {
    if (!currentWorkspace?.id) {
      toast.error("工作空间信息不完整");
      return;
    }

    // MARK: 判断默认工作流可见
    let defaultVisibility: "PRIVATE" | "TEAM_EDITABLE" = "PRIVATE";

    if (currentWorkspace?.type === "TEAM") {
      defaultVisibility = "TEAM_EDITABLE";
    }

    try {
      const newWorkflow = await createWorkflowMutation.mutateAsync({
        workspaceId: currentWorkspace.id,
        data: {
          name: workflowInfo.name,
          visibility: defaultVisibility, // 使用动态设置的可见性
        },
      });

      // 转换为编辑器需要的格式
      const editingData: Workflow = {
        id: newWorkflow.id,
        name: newWorkflow.name,
        description: workflowInfo.description,
        nodes: [],
        edges: [],
        createdAt: newWorkflow.createdAt,
        updatedAt: newWorkflow.updatedAt,
        createdBy: newWorkflow.creator?.user?.name || "当前用户",
        isDraft: newWorkflow.status === "DRAFT",
        version: newWorkflow.version,
        assigneeMap: newWorkflow.assigneeMap || {},
        totalSteps: newWorkflow.totalSteps,
      };

      setEditingWorkflow(editingData);
      setIsSetupModalOpen(false);
      setViewMode("editor");
      toast.success("工作流创建成功");
    } catch (error) {
      console.error("创建工作流失败:", error);
      toast.error("创建工作流失败");
    }
  };

  const handleEditWorkflow = (workflowResponse: WorkflowResponse) => {
    // 转换API响应到编辑器格式
    const workflow: Workflow = {
      id: workflowResponse.id,
      name: workflowResponse.name,
      description: "", // 从JSON中获取或设置默认值
      nodes: [],
      edges: [],
      createdAt: workflowResponse.createdAt,
      updatedAt: workflowResponse.updatedAt,
      createdBy: workflowResponse.creator?.user?.name || "未知用户",
      isDraft: workflowResponse.status === "DRAFT",
      version: workflowResponse.version,
      assigneeMap: workflowResponse.assigneeMap || {},
      totalSteps: workflowResponse.totalSteps,
    };

    // 如果有JSON数据，解析节点和边
    if (workflowResponse.json) {
      try {
        const parsedData = JSON.parse(workflowResponse.json);
        workflow.nodes = parsedData.nodes || [];
        workflow.edges = parsedData.edges || [];
        workflow.description = parsedData.description || "";
      } catch (error) {
        console.error("解析工作流JSON失败:", error);
      }
    }

    setEditingWorkflow(workflow);
    setViewMode("editor");
  };

  // MARK: 保存工作流
  const handleSaveWorkflow = async (workflow: Workflow) => {
    if (!currentWorkspace?.id) {
      toast.error("工作空间信息不完整");
      return;
    }

    try {
      await updateWorkflowJsonMutation.mutateAsync({
        workspaceId: currentWorkspace.id,
        workflowId: workflow.id,
        workflowData: {
          nodes: workflow.nodes,
          edges: workflow.edges,
          assigneeMap: workflow.assigneeMap,
        },
      });

      setEditingWorkflow(null);
      setViewMode("list");
    } catch (error) {
      console.error("保存工作流失败:", error);
      toast.error("保存工作流失败");
    }
  };

  // MARK: 删除工作流
  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!currentWorkspace?.id) {
      toast.error("工作空间信息不完整");
      return;
    }

    if (confirm("确定要删除这个工作流吗？")) {
      try {
        await deleteWorkflowMutation.mutateAsync({
          workspaceId: currentWorkspace.id,
          workflowId,
        });
        toast.success("工作流删除成功");
      } catch (error) {
        console.error("删除工作流失败:", error);
        toast.error("删除工作流失败");
      }
    }
  };

  // MARK: 打开工作流设置
  const handleOpenSettings = (workflow: WorkflowResponse) => {
    setSelectedWorkflow(workflow);
    setIsSettingsModalOpen(true);
  };

  // MARK: 关闭工作流设置
  const handleCloseSettings = () => {
    setSelectedWorkflow(null);
    setIsSettingsModalOpen(false);
  };

  // MARK: 更新工作流
  const handleWorkflowUpdate = () =>
    // updatedWorkflow: WorkflowResponse
    {
      // 这里可以添加额外的处理逻辑，比如更新本地状态
      // React Query会自动刷新数据
    };

  // MARK: 返回工作流列表
  const handleBackToList = () => {
    setEditingWorkflow(null);
    setViewMode("list");
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-app-text-secondary">
          <RiLoader4Line className="w-5 h-5 animate-spin" />
          加载中...
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <RiFlowChart className="w-12 h-12 text-app-text-muted mx-auto mb-3" />
          <h3 className="text-base font-medium text-app-text-primary mb-1">
            加载失败
          </h3>
          <p className="text-app-text-secondary text-sm">
            {error.message || "获取工作流列表失败"}
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === "editor") {
    return (
      <div className="h-full w-full">
        <WorkflowEditor
          workflow={editingWorkflow}
          onSave={handleSaveWorkflow}
          onCancel={handleBackToList}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-app-bg">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-app-text-primary">
              工作流管理
            </h1>
            <p className="text-app-text-secondary text-sm mt-0.5">
              管理团队工作流模板，创建标准化流程
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            <RiAddLine className="w-4 h-4" />
            新建工作流
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-app-content-bg rounded-lg border border-app-border p-3">
            <p className="text-xs text-app-text-secondary mb-1">总工作流</p>
            <p className="text-xl font-semibold text-app-text-primary">
              {stats.total}
            </p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-3">
            <p className="text-xs text-app-text-secondary mb-1">草稿</p>
            <p className="text-xl font-semibold text-app-text-primary">
              {stats.draft}
            </p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-3">
            <p className="text-xs text-app-text-secondary mb-1">已发布</p>
            <p className="text-xl font-semibold text-app-text-primary">
              {stats.published}
            </p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-3">
            <p className="text-xs text-app-text-secondary mb-1">使用中</p>
            <p className="text-xl font-semibold text-app-text-primary">
              {stats.active}
            </p>
          </div>
        </div>

        {/* Workflows List */}
        <div className="bg-app-content-bg rounded-lg border border-app-border">
          <div className="p-3 border-b border-app-border flex justify-between items-center">
            <h2 className="text-base font-semibold text-app-text-primary">
              工作流列表
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDraftsOnly(!showDraftsOnly)}
                className={`text-sm px-3 py-1 rounded-md transition-colors ${
                  showDraftsOnly
                    ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                    : "text-app-text-secondary hover:text-app-text-primary"
                }`}
              >
                {showDraftsOnly ? "显示所有" : "仅显示草稿"}
              </button>
            </div>
          </div>

          {workflows.length === 0 ? (
            <div className="p-8 text-center">
              <RiFlowChart className="w-12 h-12 text-app-text-muted mx-auto mb-3" />
              <h3 className="text-base font-medium text-app-text-primary mb-1">
                还没有工作流
              </h3>
              <p className="text-app-text-secondary text-sm mb-4">
                创建第一个工作流模板来标准化团队流程
              </p>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors mx-auto"
              >
                <RiAddLine className="w-4 h-4" />
                创建工作流
              </button>
            </div>
          ) : (
            <div className="divide-y divide-app-border">
              {workflows
                .filter(
                  (workflow) => !showDraftsOnly || workflow.status === "DRAFT"
                )
                .map((workflow) => (
                  <div
                    key={workflow.id}
                    className="p-3 hover:bg-app-button-hover transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-app-text-primary mb-1 truncate flex items-center gap-2">
                          {workflow.name}
                          {workflow.status === "DRAFT" && (
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded">
                              草稿
                            </span>
                          )}
                          {workflow.status === "PUBLISHED" && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                              已发布
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-app-text-muted">
                          <span>节点: {workflow.totalSteps}</span>
                          <span>
                            创建者: {workflow.creator?.user?.name || "未知"}
                          </span>
                          <span>
                            创建时间:{" "}
                            {new Date(workflow.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-3">
                        <button
                          onClick={() => handleEditWorkflow(workflow)}
                          className="p-1.5 text-app-text-secondary hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="查看/编辑"
                        >
                          <RiEyeLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenSettings(workflow)}
                          className="p-1.5 text-app-text-secondary hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                          title="设置"
                        >
                          <RiSettings3Line className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditWorkflow(workflow)}
                          className="p-1.5 text-app-text-secondary hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          title="编辑"
                        >
                          <RiEditLine className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          className="p-1.5 text-app-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="删除"
                          disabled={deleteWorkflowMutation.isPending}
                        >
                          {deleteWorkflowMutation.isPending ? (
                            <RiLoader4Line className="w-4 h-4 animate-spin" />
                          ) : (
                            <RiDeleteBinLine className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Workflow Setup Modal */}
      <WorkflowSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onContinue={handleSetupContinue}
      />

      {/* Workflow Settings Modal */}
      {selectedWorkflow && (
        <WorkflowSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={handleCloseSettings}
          workflow={selectedWorkflow}
          onUpdate={handleWorkflowUpdate}
        />
      )}
    </div>
  );
}
