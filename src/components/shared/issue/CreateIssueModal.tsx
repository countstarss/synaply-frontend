"use client";

import React, { useState } from "react";
import { RiCloseLine, RiFlowChart } from "react-icons/ri";
import { useAuth } from "@/context/AuthContext";

import { CreateIssueDto } from "@/lib/fetchers/issue";
import { useCreateIssue, useCreateWorkflowIssue } from "@/hooks/useIssueApi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkflows } from "@/hooks/useWorkflowApi";
import { Workflow } from "@/types/team";
import { WorkflowResponse } from "@/lib/fetchers/workflow";

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateIssueModal({
  isOpen,
  onClose,
  onCreated,
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

  // 获取工作流列表
  const { data: workflowResponses = [], isLoading: isLoadingWorkflows } =
    useWorkflows(workspaceId);
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
    }
  );

  // 重置表单
  const resetForm = () => {
    setIssueType("normal");
    setTitle("");
    setDescription("");
    setDirectAssigneeId("");
    setDueDate("");
    setSelectedWorkflowId("");
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
    (workflow) => workflow.id === selectedWorkflowId
  );

  return (
    <div className="fixed inset-0 dark:bg-black/50 bg-white/80 flex items-center justify-center z-50">
      <div className="bg-app-content-bg rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-app-border">
          <h2 className="text-xl font-semibold text-app-text-primary">
            新建 Issue
            <span className="text-sm font-normal text-app-text-secondary ml-2">
              ({workspaceType === "PERSONAL" ? "个人空间" : "团队空间"})
            </span>
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-app-button-hover rounded-lg transition-colors"
          >
            <RiCloseLine className="w-5 h-5 text-app-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
