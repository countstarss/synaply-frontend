"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  RiAddLine,
  RiSearchLine,
  RiFilter3Line,
  RiLoader4Line,
} from "react-icons/ri";

import { getIssues, Issue } from "@/lib/fetchers/issue";
import CreateIssueModal from "@/components/shared/issue/CreateIssueModal";
import { useWorkspace } from "@/hooks/useWorkspace";
import IssueDetailModal from "@/components/shared/issue/NormalIssueDetail";

export default function IssuesPage() {
  const { session } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { currentWorkspace } = useWorkspace();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!currentWorkspace?.id) return;

    try {
      if (!session?.access_token) throw new Error("认证失败");
      const fetchedIssues = await getIssues(
        currentWorkspace?.id || "",
        session.access_token
      );
      setIssues(fetchedIssues);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载 Issue 失败");
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id, session?.access_token]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const filteredIssues = issues.filter((issue) =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center text-app-text-muted">
          <RiLoader4Line className="animate-spin w-6 h-6 mr-2" />
          加载 Issue 中...
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-red-500">
          <p>{error}</p>
          <button
            onClick={fetchIssues}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            重试
          </button>
        </div>
      );
    }

    if (filteredIssues.length === 0) {
      return (
        <div className="flex-1 text-center py-12">
          <p className="text-app-text-muted mb-4">
            {issues.length === 0 ? "还没有 Issue" : "没有找到匹配的 Issue"}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
          >
            <RiAddLine className="w-4 h-4" />
            创建第一个 Issue
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-1 p-4">
        {filteredIssues.map((issue) => (
          <div
            key={issue.id}
            className="group flex items-center gap-4 px-4 py-3 hover:bg-app-button-hover rounded-lg cursor-pointer transition-colors"
            onClick={() => setSelectedIssue(issue)} // 点击打开详情
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-app-text-primary truncate">
                {issue.title}
              </h3>
              <p className="text-xs text-app-text-secondary truncate mt-1">
                {issue.description || "没有描述"}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-app-text-muted">
              {issue.directAssigneeId && (
                <span>负责人: {issue.directAssigneeId}</span>
              )}
              {issue.dueDate && (
                <span>
                  截止日期: {new Date(issue.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-app-bg">
      {/* Header */}
      <div className="border-b border-app-border px-6 py-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-app-text-primary">Issues</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          <RiAddLine className="w-4 h-4" />
          新建 Issue
        </button>
      </div>

      {/* Toolbar */}
      <div className="border-b border-app-border px-6 py-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
            <input
              type="text"
              placeholder="搜索 issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-app-button-hover border border-app-border rounded-md text-sm text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-md">
            <RiFilter3Line className="w-4 h-4" />
            筛选
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto">{renderContent()}</div>

      {/* Modals */}
      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={fetchIssues} // 创建成功后重新获取列表
      />

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          isOpen={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onUpdate={fetchIssues} // 更新成功后也重新获取列表
        />
      )}
    </div>
  );
}
