"use client";

import React, { useEffect, useState } from "react";
import { RiCloseLine, RiFlowChart } from "react-icons/ri";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/hooks/useProjectApi";
import { useCreateIssue, useCreateWorkflowIssue } from "@/hooks/useIssueApi";
import { useWorkspace } from "@/hooks/useWorkspace";
import type { CreateIssueDto } from "@/lib/fetchers/issue";
import type { WorkflowResponse } from "@/lib/fetchers/workflow";
import type { Workflow } from "@/types/team";
import { useWorkflows } from "@/hooks/useWorkflowApi";

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialProjectId?: string;
  projectContextName?: string;
}

export default function CreateIssueModal({
  isOpen,
  onClose,
  onCreated,
  initialProjectId,
  projectContextName,
}: CreateIssueModalProps) {
  const { session } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const workspaceType = currentWorkspace?.type || "PERSONAL";

  // 1. 添加工作流类型选择
  const [issueType, setIssueType] = useState<"normal" | "workflow">("normal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [directAssigneeId, setDirectAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialProjectId || "",
  );

  // 获取工作流列表
  const { data: workflowResponses = [], isLoading: isLoadingWorkflows } =
    useWorkflows(workspaceId);
  const { data: projects = [], isLoading: isLoadingProjects } =
    useProjects(workspaceId);
  const createIssueMutation = useCreateIssue();
  const createWorkflowIssueMutation = useCreateWorkflowIssue();

  // 转换API响应的工作流到前端格式
  const workflows = workflowResponses.map(
    (workflowResponse: WorkflowResponse): Workflow => {
      const workflow: Workflow = {
        id: workflowResponse.id,
        name: workflowResponse.name,
        description: "",
        nodes: [],
        edges: [],
        createdAt: workflowResponse.createdAt,
        updatedAt: workflowResponse.updatedAt,
        createdBy: workflowResponse.creator?.user?.name || "未知用户",
        isDraft: workflowResponse.status === "DRAFT",
        totalSteps: workflowResponse.totalSteps,
      };

      // 解析JSON数据
      if (workflowResponse.json) {
        try {
          const parsedData =
            typeof workflowResponse.json === "string"
              ? JSON.parse(workflowResponse.json)
              : workflowResponse.json;

          workflow.nodes = parsedData.nodes || [];
          workflow.edges = parsedData.edges || [];
          workflow.description = parsedData.description || "";
        } catch (error) {
          console.error("解析工作流JSON失败:", error);
        }
      }

      return workflow;
    },
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedProjectId(initialProjectId || "");
  }, [initialProjectId, isOpen]);

  // 重置表单
  const resetForm = () => {
    setIssueType("normal");
    setTitle("");
    setDescription("");
    setDirectAssigneeId("");
    setDueDate("");
    setSelectedWorkflowId("");
    setSelectedProjectId(initialProjectId || "");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 2. 更新提交逻辑以支持工作流
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("请输入标题");
      return;
    }

    if (issueType === "workflow" && !selectedWorkflowId) {
      alert("请选择工作流");
      return;
    }

    if (!session?.access_token) {
      alert("无法获取认证信息，请重新登录");
      return;
    }

    const issueData: Partial<CreateIssueDto> = {
      title: title.trim(),
      description: description.trim() || undefined,
      projectId:
        issueType === "normal" ? selectedProjectId || undefined : undefined,
      directAssigneeId: directAssigneeId.trim() || undefined,
      dueDate: dueDate || undefined,
      workspaceId,
    };

    try {
      if (issueType === "normal") {
        await createIssueMutation.mutateAsync({
          workspaceId,
          issue: issueData,
        });
      } else {
        // 基于工作流创建
        await createWorkflowIssueMutation.mutateAsync({
          workspaceId,
          issue: issueData,
          workflowId: selectedWorkflowId,
        });
      }

      onCreated(); // 重新获取 issue 列表
      handleClose(); // 关闭并重置表单
    } catch (error) {
      console.error("创建Issue失败:", error);
      alert(error instanceof Error ? error.message : "创建Issue失败，请重试");
    }
  };

  if (!isOpen) return null;

  // 获取选中的工作流
  const selectedWorkflow = workflows.find(
    (workflow) => workflow.id === selectedWorkflowId,
  );
  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  );
  const isProjectContext = !!initialProjectId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-app-content-bg shadow-xl">
        <div className="flex items-center justify-between border-b border-app-border p-6">
          <h2 className="text-xl font-semibold text-app-text-primary">
            新建 Issue
            <span className="ml-2 text-sm font-normal text-app-text-secondary">
              ({workspaceType === "PERSONAL" ? "个人空间" : "团队空间"})
            </span>
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 transition-colors hover:bg-app-button-hover"
          >
            <RiCloseLine className="h-5 w-5 text-app-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* 仅在团队空间显示工作流选项 */}
          {workspaceType === "TEAM" && (
            <div>
              <label className="block text-sm font-medium text-app-text-primary mb-3">
                Issue 类型
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="issueType"
                    value="normal"
                    checked={issueType === "normal"}
                    onChange={() => setIssueType("normal")}
                    className="mr-2"
                  />
                  <span className="text-app-text-secondary">普通 Issue</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="issueType"
                    value="workflow"
                    checked={issueType === "workflow"}
                    onChange={() => setIssueType("workflow")}
                    className="mr-2"
                  />
                  <span className="text-app-text-secondary">基于工作流</span>
                </label>
              </div>
            </div>
          )}

          {/* 仅在选择工作流类型时显示工作流选择器 */}
          {workspaceType === "TEAM" && issueType === "workflow" && (
            <div>
              <label className="block text-sm font-medium text-app-text-primary mb-2">
                选择工作流
              </label>
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={issueType === "workflow"}
                disabled={isLoadingWorkflows}
              >
                <option value="">请选择工作流...</option>
                {isLoadingWorkflows ? (
                  <option value="" disabled>
                    加载中...
                  </option>
                ) : (
                  workflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name} ({workflow.totalSteps || 0} 个节点)
                    </option>
                  ))
                )}
              </select>
              {selectedWorkflow && (
                <div className="my-2 p-3 bg-app-button-hover rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <RiFlowChart className="w-4 h-4 text-app-text-secondary" />
                    <span className="text-sm font-medium text-app-text-primary">
                      {selectedWorkflow.name}
                    </span>
                  </div>
                  <p className="text-sm text-app-text-secondary">
                    {selectedWorkflow.description || "无描述"}
                  </p>
                  <div className="mt-2 text-xs text-app-text-muted">
                    包含 {selectedWorkflow.totalSteps || 0} 个节点
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-app-text-primary">
              归属项目
              {isProjectContext && (
                <span className="ml-2 text-xs font-normal text-app-text-muted">
                  已默认填入当前项目
                </span>
              )}
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoadingProjects || issueType === "workflow"}
            >
              <option value="">不归属任何项目</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {selectedProject ? (
              <div className="mt-2 rounded-lg border border-app-border bg-app-button-hover px-3 py-2">
                <div className="text-sm font-medium text-app-text-primary">
                  {selectedProject.name}
                </div>
                <div className="mt-1 text-xs text-app-text-secondary">
                  {selectedProject.description || "这个项目还没有补充描述。"}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-app-text-muted">
                如果暂时不归属项目，可以先保持为空。
              </p>
            )}
            {isProjectContext && (
              <p className="mt-2 text-xs text-app-text-muted">
                当前从项目视图发起创建，默认已选中
                {projectContextName || selectedProject?.name || "当前项目"}。
              </p>
            )}
            {issueType === "workflow" && (
              <p className="mt-2 text-xs text-app-text-muted">
                当前工作流 Issue 创建流程暂不写入 projectId，请使用普通 Issue。
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-2">
              标题 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入 Issue 标题..."
              className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-2">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入详细描述..."
              rows={4}
              className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-app-text-primary mb-2">
                负责人 ID
              </label>
              <input
                type="text"
                value={directAssigneeId}
                onChange={(e) => setDirectAssigneeId(e.target.value)}
                placeholder="输入负责人团队成员ID..."
                className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-app-text-primary mb-2">
                截止日期
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div> */}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-app-border">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              disabled={
                createIssueMutation.isPending ||
                createWorkflowIssueMutation.isPending
              }
            >
              {createIssueMutation.isPending ||
              createWorkflowIssueMutation.isPending
                ? "创建中..."
                : "创建 Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
