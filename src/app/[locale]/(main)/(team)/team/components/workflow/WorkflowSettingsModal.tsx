import React, { useState } from "react";
import { RiCloseLine, RiSaveLine, RiLoader4Line } from "react-icons/ri";
import { useUpdateWorkflow, usePublishWorkflow } from "@/hooks/useWorkflowApi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { toast } from "sonner";

interface WorkflowSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: {
    id: string;
    name: string;
    status: string;
    visibility: string;
    totalSteps: number;
    description?: string;
  };
  onUpdate: (updatedWorkflow: unknown) => void;
}

export default function WorkflowSettingsModal({
  isOpen,
  onClose,
  workflow,
  onUpdate,
}: WorkflowSettingsModalProps) {
  const [name, setName] = useState(workflow.name);
  const [visibility, setVisibility] = useState(workflow.visibility);
  const [description, setDescription] = useState(workflow.description || "");

  const { currentWorkspace } = useWorkspace();
  const updateWorkflowMutation = useUpdateWorkflow();
  const publishWorkflowMutation = usePublishWorkflow();

  const handleSave = async () => {
    if (!currentWorkspace?.id) {
      toast.error("工作空间信息不完整");
      return;
    }

    try {
      const updatedWorkflow = await updateWorkflowMutation.mutateAsync({
        workspaceId: currentWorkspace.id,
        workflowId: workflow.id,
        data: {
          // 这里需要根据后端API调整字段
          status: workflow.status,
        },
      });

      onUpdate(updatedWorkflow);
      onClose();
      toast.success("工作流设置已保存");
    } catch (error) {
      console.error("保存工作流设置失败:", error);
      toast.error("保存设置失败");
    }
  };

  const handlePublish = async () => {
    if (!currentWorkspace?.id) {
      toast.error("工作空间信息不完整");
      return;
    }

    if (workflow.totalSteps === 0) {
      toast.error("请先添加工作流步骤再发布");
      return;
    }

    try {
      const publishedWorkflow = await publishWorkflowMutation.mutateAsync({
        workspaceId: currentWorkspace.id,
        workflowId: workflow.id,
      });

      onUpdate(publishedWorkflow);
      onClose();
      toast.success("工作流已发布");
    } catch (error) {
      console.error("发布工作流失败:", error);
      toast.error("发布失败");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-app-content-bg rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-app-border">
          <h2 className="text-lg font-semibold text-app-text-primary">
            工作流设置
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-app-button-hover rounded transition-colors"
          >
            <RiCloseLine className="w-5 h-5 text-app-text-secondary" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 基本信息 */}
          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-1">
              工作流名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入工作流名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-1">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="工作流描述（可选）"
            />
          </div>

          {/* 可见性设置 */}
          <div>
            <label className="block text-sm font-medium text-app-text-primary mb-1">
              可见性
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PRIVATE">私有</option>
              <option value="PUBLIC">公开</option>
              <option value="TEAM_READONLY">团队只读</option>
              <option value="TEAM_EDITABLE">团队可编辑</option>
            </select>
          </div>

          {/* 状态信息 */}
          <div className="bg-app-bg p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-app-text-secondary">状态:</span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  workflow.status === "PUBLISHED"
                    ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                }`}
              >
                {workflow.status === "PUBLISHED" ? "已发布" : "草稿"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-app-text-secondary">步骤数:</span>
              <span className="text-app-text-primary">
                {workflow.totalSteps}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-app-border">
          <div className="flex gap-2">
            {workflow.status === "DRAFT" && workflow.totalSteps > 0 && (
              <button
                onClick={handlePublish}
                disabled={publishWorkflowMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm rounded-lg transition-colors"
              >
                {publishWorkflowMutation.isPending ? (
                  <RiLoader4Line className="w-4 h-4 animate-spin" />
                ) : (
                  <RiSaveLine className="w-4 h-4" />
                )}
                发布工作流
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-app-text-secondary hover:text-app-text-primary text-sm rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={updateWorkflowMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg transition-colors"
            >
              {updateWorkflowMutation.isPending ? (
                <RiLoader4Line className="w-4 h-4 animate-spin" />
              ) : (
                <RiSaveLine className="w-4 h-4" />
              )}
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
