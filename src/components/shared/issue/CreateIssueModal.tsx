"use client";

import React, { useState } from "react";
import { RiCloseLine } from "react-icons/ri";
import { useAuth } from "@/context/AuthContext";

import { createIssue, CreateIssueDto } from "@/lib/fetchers/issue";
import { useWorkspace } from "@/hooks/useWorkspace";

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

  // 1. 简化状态以匹配 CreateIssueDto
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [directAssigneeId, setDirectAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const { currentWorkspace } = useWorkspace();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDirectAssigneeId("");
    setDueDate("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // 2. 更新提交逻辑以使用新的 fetcher
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("请输入标题");
      return;
    }

    if (!session?.access_token) {
      alert("无法获取认证信息，请重新登录");
      return;
    }

    const issueData: CreateIssueDto = {
      title: title.trim(),
      workspaceId: currentWorkspace?.id || "",
      description: description.trim() || undefined,
      directAssigneeId: directAssigneeId.trim() || undefined,
      dueDate: dueDate || undefined,
    };

    try {
      await createIssue(issueData, session.access_token);
      onCreated(); // 重新获取 issue 列表
      handleClose(); // 关闭并重置表单
    } catch (error) {
      console.error("创建Issue失败:", error);
      alert(error instanceof Error ? error.message : "创建Issue失败，请重试");
    }
  };

  if (!isOpen) return null;

  // 3. 简化表单
  return (
    <div className="fixed inset-0 dark:bg-black/50 bg-white/80 flex items-center justify-center z-50">
      <div className="bg-app-content-bg rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-app-border">
          <h2 className="text-xl font-semibold text-app-text-primary">
            新建 Issue
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-app-button-hover rounded-lg transition-colors"
          >
            <RiCloseLine className="w-5 h-5 text-app-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                负责人 (Assignee ID)
              </label>
              <input
                type="text"
                value={directAssigneeId}
                onChange={(e) => setDirectAssigneeId(e.target.value)}
                placeholder="输入负责人团队成员ID..."
                className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
            >
              创建 Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
