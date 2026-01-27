"use client";

import React, { useState } from "react";
import {
  RiAddLine,
  RiSearchLine,
  RiFilter3Line,
  RiFlowChart,
  RiEdit2Line,
  RiDeleteBinLine,
} from "react-icons/ri";
import CreateIssueModal from "@/components/shared/issue/CreateIssueModal";
import NormalIssueDetail from "@/components/shared/issue/NormalIssueDetail";
import { Issue } from "@/lib/fetchers/issue";
import { useIssues } from "@/hooks/useIssueApi";
import { useDeleteIssue } from "@/hooks/useIssueApi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useQueryClient } from "@tanstack/react-query";
import { priorityConfig, statusConfig } from "@/lib/data/issueConfig";
import { toast } from "sonner";
import WorkflowIssueDetail from "@/components/issue/WorkflowIssueDetail";

export default function Issues() {
  const [selectedView, setSelectedView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const { data: issues = [], isLoading: isLoadingIssues } =
    useIssues(workspaceId);
  const queryClient = useQueryClient();
  const deleteIssueMutation = useDeleteIssue();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isNormalDetailOpen, setIsNormalDetailOpen] = useState(false);

  const handleCreateIssue = () => {
    // 创建成功后，由 createIssue / createWorkflowIssue 的 mutation 成功回调已经触发了 invalidateQueries
    // 这里手动再触发一次确保列表及时刷新
    queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
  };

  const handleViewIssue = (issue: Issue) => {
    setSelectedIssue(issue);
    if (issue.issueType === "WORKFLOW") {
      setIsDetailModalOpen(true);
    } else {
      setIsNormalDetailOpen(true);
    }
  };

  const filteredIssues = issues.filter((issue) =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCloseDetail = () => {
    setSelectedIssue(null);
    setIsDetailModalOpen(false);
  };

  const handleCloseNormalDetail = () => {
    setSelectedIssue(null);
    setIsNormalDetailOpen(false);
  };

  const handleUpdateNormalIssue = () => {
    queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
  };

  const handleUpdateWorkflowIssue = () => {
    queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
  };

  const handleDeleteIssue = (issue: Issue) => {
    if (confirm(`确定要删除该 Issue: ${issue.title} ？删除后不可恢复。`)) {
      deleteIssueMutation.mutate(
        { workspaceId, issueId: issue.id },
        {
          onSuccess: () => {
            toast.success("已删除 Issue");
          },
          onError: (err: unknown) => {
            toast.error(
              err instanceof Error ? err.message : "删除 Issue 失败，请重试",
            );
          },
        },
      );
    }
  };

  return (
    <div className="h-full flex flex-col bg-app-bg">
      {/* Header */}
      <div className="border-b border-app-border px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-app-text-primary">
              Issues
            </h1>
            <div className="flex items-center gap-1 bg-app-button-hover rounded p-0.5">
              <button
                className={`px-2 py-0.5 text-sm rounded transition-colors ${
                  selectedView === "all"
                    ? "bg-app-content-bg text-app-text-primary shadow-sm"
                    : "text-app-text-secondary hover:text-app-text-primary"
                }`}
                onClick={() => setSelectedView("all")}
              >
                全部
              </button>
              <button
                className={`px-2 py-0.5 text-sm rounded transition-colors ${
                  selectedView === "my"
                    ? "bg-app-content-bg text-app-text-primary shadow-sm"
                    : "text-app-text-secondary hover:text-app-text-primary"
                }`}
                onClick={() => setSelectedView("my")}
              >
                我的
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            <RiAddLine className="w-4 h-4" />
            新建 Issue
          </button>
        </div>
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
              className="w-full pl-8 pr-3 py-1.5 bg-app-button-hover border border-app-border rounded-md text-sm text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-md">
            <RiFilter3Line className="w-4 h-4" />
            筛选
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4">
          {isLoadingIssues ? (
            <div className="text-center py-12 text-app-text-muted">
              加载中...
            </div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-app-text-muted mb-4">
                {issues.length === 0 ? "还没有 Issue" : "没有找到匹配的 Issue"}
              </div>
              {issues.length === 0 && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
                >
                  <RiAddLine className="w-4 h-4" />
                  创建第一个 Issue
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredIssues.map((issue) => {
                const statusKey = (issue.currentStepStatus ||
                  "TODO") as keyof typeof statusConfig;
                const status = statusConfig[statusKey];
                const priorityKey = (issue.priority ||
                  "NORMAL") as keyof typeof priorityConfig;
                const priority = priorityConfig[priorityKey];

                return (
                  <div
                    key={issue.id}
                    className="group flex items-center gap-4 px-4 py-3 hover:bg-app-button-hover rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleViewIssue(issue)}
                  >
                    <div className={`flex items-center ${status.color}`}>
                      {status.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-app-text-primary truncate">
                          {issue.title}
                        </h3>
                        {issue.issueType === "WORKFLOW" && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded text-xs">
                            <RiFlowChart className="w-3 h-3" />
                            <span>工作流</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-app-text-muted">
                          #{issue.id}
                        </span>
                        {/* 可以在此处显示其他自定义字段 */}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${priority.color}`}
                      >
                        {priority.label}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewIssue(issue);
                          }}
                          className="p-1 hover:bg-app-content-bg rounded transition-colors"
                          title="查看 / 编辑"
                        >
                          <RiEdit2Line className="w-4 h-4 text-app-text-secondary" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteIssue(issue);
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="删除"
                        >
                          <RiDeleteBinLine className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Issue Modal */}
      <CreateIssueModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleCreateIssue}
      />

      {/* Workflow Issue Detail Modal */}
      {selectedIssue && selectedIssue.issueType === "WORKFLOW" && (
        <WorkflowIssueDetail
          issue={selectedIssue}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetail}
          onUpdate={handleUpdateWorkflowIssue}
        />
      )}

      {/* Normal Issue Detail Modal */}
      {selectedIssue && selectedIssue.issueType === "NORMAL" && (
        <NormalIssueDetail
          issue={selectedIssue}
          isOpen={isNormalDetailOpen}
          onClose={handleCloseNormalDetail}
          onUpdate={handleUpdateNormalIssue}
        />
      )}
    </div>
  );
}
