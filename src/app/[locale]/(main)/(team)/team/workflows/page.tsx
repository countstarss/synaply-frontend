"use client";

import React, { useState, useEffect } from "react";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiFlowChart,
} from "react-icons/ri";
import WorkflowEditor from "../components/WorkflowEditor";
import WorkflowSetupModal from "../components/WorkflowSetupModal";
import { Workflow } from "@/types/team";
import { workflowStorage } from "../utils/storage";

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "editor">("list");
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);

  useEffect(() => {
    setWorkflows(workflowStorage.getAll());
  }, []);

  const handleCreateNew = () => {
    setEditingWorkflow(null);
    setIsSetupModalOpen(true);
  };

  const handleSetupContinue = (workflowInfo: {
    name: string;
    description: string;
  }) => {
    setEditingWorkflow({
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: workflowInfo.name,
      description: workflowInfo.description,
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "当前用户",
      isDraft: true,
    });
    setIsSetupModalOpen(false);
    setViewMode("editor");
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setViewMode("editor");
  };

  const handleSaveWorkflow = (workflow: Workflow) => {
    workflowStorage.save(workflow);
    setWorkflows(workflowStorage.getAll());
    setEditingWorkflow(null);
    setViewMode("list");
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    if (confirm("确定要删除这个工作流吗？")) {
      workflowStorage.delete(workflowId);
      setWorkflows(workflowStorage.getAll());
    }
  };

  const handleBackToList = () => {
    setEditingWorkflow(null);
    setViewMode("list");
  };

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
              {workflows.length}
            </p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-3">
            <p className="text-xs text-app-text-secondary mb-1">草稿</p>
            <p className="text-xl font-semibold text-app-text-primary">
              {workflows.filter((w) => w.isDraft).length}
            </p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-3">
            <p className="text-xs text-app-text-secondary mb-1">最近更新</p>
            <p className="text-xl font-semibold text-app-text-primary">
              {workflows.length > 0 ? "今天" : "-"}
            </p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-3">
            <p className="text-xs text-app-text-secondary mb-1">使用中</p>
            <p className="text-xl font-semibold text-app-text-primary">
              {workflows.filter((w) => w.tags?.includes("active")).length}
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
                .filter((workflow) => !showDraftsOnly || workflow.isDraft)
                .map((workflow) => (
                  <div
                    key={workflow.id}
                    className="p-3 hover:bg-app-button-hover transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-app-text-primary mb-1 truncate flex items-center gap-2">
                          {workflow.name}
                          {workflow.isDraft && (
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded">
                              草稿
                            </span>
                          )}
                        </h3>
                        <p className="text-app-text-secondary text-sm mb-2 line-clamp-2">
                          {workflow.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-app-text-muted">
                          <span>节点: {workflow.nodes.length}</span>
                          <span>创建者: {workflow.createdBy}</span>
                          <span>
                            创建时间:{" "}
                            {new Date(workflow.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {workflow.tags && workflow.tags.length > 0 && (
                          <div className="flex gap-1.5 mt-2">
                            {workflow.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs px-1.5 py-0.5 bg-app-button-hover text-app-text-secondary rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
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
                        >
                          <RiDeleteBinLine className="w-4 h-4" />
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
    </div>
  );
}
