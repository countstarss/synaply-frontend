"use client";

import React, { useState, useEffect } from "react";
import {
  RiAddLine,
  RiSearchLine,
  RiFilter3Line,
  RiCheckboxCircleLine,
  RiRadioButtonLine,
  RiPlayCircleLine,
  RiCloseCircleLine,
  RiFlowChart,
  RiEyeLine,
} from "react-icons/ri";
import CreateIssueModal from "../../../../../../components/shared/issue/CreateIssueModal";
import WorkflowIssueDetail from "../components/WorkflowIssueDetail";
import { Issue } from "@/types/team";
import { issueStorage } from "../utils/storage";

const statusConfig = {
  todo: {
    label: "待处理",
    icon: <RiRadioButtonLine className="w-4 h-4" />,
    color: "text-gray-500 dark:text-gray-400",
  },
  in_progress: {
    label: "进行中",
    icon: <RiPlayCircleLine className="w-4 h-4" />,
    color: "text-blue-600 dark:text-blue-400",
  },
  done: {
    label: "已完成",
    icon: <RiCheckboxCircleLine className="w-4 h-4" />,
    color: "text-green-600 dark:text-green-400",
  },
  canceled: {
    label: "已取消",
    icon: <RiCloseCircleLine className="w-4 h-4" />,
    color: "text-gray-400 dark:text-gray-500",
  },
};

const priorityConfig = {
  urgent: {
    label: "紧急",
    color:
      "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  high: {
    label: "高",
    color:
      "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  },
  medium: {
    label: "中",
    color:
      "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  low: {
    label: "低",
    color:
      "bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  },
};

export default function Issues() {
  const [selectedView, setSelectedView] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = () => {
    const storedIssues = issueStorage.getAll();
    setIssues(storedIssues);
  };

  const handleCreateIssue = () => {
    loadIssues(); // Reload issues from storage
  };

  const handleViewIssue = (issue: Issue) => {
    if (issue.type === "workflow") {
      setSelectedIssue(issue);
      setIsDetailModalOpen(true);
    } else {
      // Navigate to normal issue detail page
      console.log("Open normal issue detail:", issue);
      // TODO: Implement navigation to normal issue detail
    }
  };

  const handleCloseDetail = () => {
    setSelectedIssue(null);
    setIsDetailModalOpen(false);
  };

  const handleUpdateIssue = () => {
    loadIssues(); // Reload issues when workflow issue is updated
  };

  const filteredIssues = issues.filter((issue) =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          {filteredIssues.length === 0 ? (
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
                const status = statusConfig[issue.status];
                const priority = priorityConfig[issue.priority];

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
                        {issue.type === "workflow" && (
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
                        {issue.project && (
                          <span className="text-xs text-app-text-secondary">
                            {issue.project}
                          </span>
                        )}
                        {issue.type === "workflow" && issue.workflowData && (
                          <span className="text-xs text-app-text-secondary">
                            {issue.workflowData.workflowName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${priority.color}`}
                      >
                        {priority.label}
                      </span>
                      {issue.assignee && (
                        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-xs text-white">
                            {issue.assignee[0]}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewIssue(issue);
                        }}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-app-content-bg rounded transition-all"
                        title="查看详情"
                      >
                        <RiEyeLine className="w-4 h-4 text-app-text-secondary" />
                      </button>
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
        workspaceType="TEAM"
      />

      {/* Workflow Issue Detail Modal */}
      {selectedIssue && selectedIssue.type === "workflow" && (
        <WorkflowIssueDetail
          issue={selectedIssue}
          isOpen={isDetailModalOpen}
          onClose={handleCloseDetail}
          onUpdate={handleUpdateIssue}
        />
      )}
    </div>
  );
}
