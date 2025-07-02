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
import { Workflow } from "../../../../../types/team";
import { workflowStorage } from "../utils/storage";

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "editor">("list");

  useEffect(() => {
    setWorkflows(workflowStorage.getAll());
  }, []);

  const handleCreateNew = () => {
    setEditingWorkflow(null);
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
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                {editingWorkflow ? "编辑工作流" : "新建工作流"}
              </h1>
              <p className="text-app-text-secondary mt-1">
                {editingWorkflow
                  ? `编辑 "${editingWorkflow.name}"`
                  : "创建新的工作流模板"}
              </p>
            </div>
            <button
              onClick={handleBackToList}
              className="px-4 py-2 text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
            >
              返回列表
            </button>
          </div>
          <WorkflowEditor
            workflow={editingWorkflow}
            onSave={handleSaveWorkflow}
            onCancel={handleBackToList}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-app-bg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-app-text-primary">
              工作流管理
            </h1>
            <p className="text-app-text-secondary mt-1">
              管理团队工作流模板，创建标准化流程
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RiAddLine className="w-4 h-4" />
            新建工作流
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
            <p className="text-sm text-app-text-secondary mb-1">总工作流</p>
            <p className="text-2xl font-semibold text-app-text-primary">
              {workflows.length}
            </p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
            <p className="text-sm text-app-text-secondary mb-1">最近更新</p>
            <p className="text-2xl font-semibold text-app-text-primary">
              {workflows.length > 0 ? "今天" : "-"}
            </p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
            <p className="text-sm text-app-text-secondary mb-1">使用中</p>
            <p className="text-2xl font-semibold text-app-text-primary">
              {workflows.filter((w) => w.tags?.includes("active")).length}
            </p>
          </div>
        </div>

        {/* Workflows List */}
        <div className="bg-app-content-bg rounded-lg border border-app-border">
          <div className="p-4 border-b border-app-border">
            <h2 className="text-lg font-semibold text-app-text-primary">
              工作流列表
            </h2>
          </div>

          {workflows.length === 0 ? (
            <div className="p-12 text-center">
              <RiFlowChart className="w-16 h-16 text-app-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-app-text-primary mb-2">
                还没有工作流
              </h3>
              <p className="text-app-text-secondary mb-6">
                创建第一个工作流模板来标准化团队流程
              </p>
              <button
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
              >
                <RiAddLine className="w-4 h-4" />
                创建工作流
              </button>
            </div>
          ) : (
            <div className="divide-y divide-app-border">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="p-4 hover:bg-app-button-hover transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-app-text-primary mb-1">
                        {workflow.name}
                      </h3>
                      <p className="text-app-text-secondary mb-2">
                        {workflow.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-app-text-muted">
                        <span>节点: {workflow.nodes.length}</span>
                        <span>创建者: {workflow.createdBy}</span>
                        <span>
                          创建时间:{" "}
                          {new Date(workflow.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {workflow.tags && workflow.tags.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {workflow.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-app-button-hover text-app-text-secondary rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEditWorkflow(workflow)}
                        className="p-2 text-app-text-secondary hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="查看/编辑"
                      >
                        <RiEyeLine className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditWorkflow(workflow)}
                        className="p-2 text-app-text-secondary hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <RiEditLine className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        className="p-2 text-app-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
    </div>
  );
}
