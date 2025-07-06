"use client";

import React, { useState, useEffect } from "react";
import { RiCloseLine, RiFlowChart } from "react-icons/ri";
import { Workflow, Issue, WorkflowIssue } from "@/types/team";
import {
  workflowStorage,
  issueStorage,
  workflowIssueStorage,
  generateId,
} from "../../../app/[locale]/(main)/(team)/team/utils/storage";

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (issue: Issue) => void;
  workspaceType: "PERSONAL" | "TEAM";
}

export default function CreateIssueModal({
  isOpen,
  onClose,
  onCreated,
  workspaceType,
}: CreateIssueModalProps) {
  const [issueType, setIssueType] = useState<"normal" | "workflow">("normal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<
    "urgent" | "high" | "medium" | "low"
  >("medium");
  const [assignee, setAssignee] = useState("");
  const [project, setProject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setWorkflows(workflowStorage.getAll());
      if (workspaceType === "PERSONAL") {
        setIssueType("normal");
      }
    }
  }, [isOpen, workspaceType]);

  const resetForm = () => {
    setIssueType("normal");
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAssignee("");
    setProject("");
    setDeadline("");
    setSelectedWorkflowId("");
    setTags("");
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("请输入标题");
      return;
    }

    if (issueType === "workflow" && !selectedWorkflowId) {
      alert("请选择工作流");
      return;
    }

    const issueId = generateId();
    const currentTime = new Date().toISOString();

    if (issueType === "normal") {
      const newIssue: Issue = {
        id: issueId,
        title: title.trim(),
        description: description.trim(),
        status: "todo",
        priority,
        assignee:
          workspaceType === "TEAM" ? assignee.trim() || undefined : undefined,
        project: project.trim() || undefined,
        createdAt: currentTime,
        updatedAt: currentTime,
        type: "normal",
        ...(workspaceType === "PERSONAL" && {
          deadline: deadline || undefined,
          tags: tags.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      };

      issueStorage.save(newIssue);
      onCreated(newIssue);
    } else {
      const workflow = workflowStorage.getById(selectedWorkflowId);
      if (!workflow) {
        alert("找不到选择的工作流");
        return;
      }

      const nodeStatuses: Record<
        string,
        {
          status: "todo" | "in_progress" | "almost" | "done";
          assignee?: string;
          startedAt?: string;
          completedAt?: string;
          comments?: string[];
        }
      > = {};
      workflow.nodes.forEach((node: { id: string }) => {
        nodeStatuses[node.id] = {
          status: "todo" as const,
          assignee: undefined,
          startedAt: undefined,
          completedAt: undefined,
          comments: [],
        };
      });

      const workflowIssue: WorkflowIssue = {
        id: issueId,
        title: title.trim(),
        description: description.trim(),
        workflowId: selectedWorkflowId,
        workflowName: workflow.name,
        status: "todo",
        priority,
        assignee: assignee.trim() || undefined,
        project: project.trim() || undefined,
        createdAt: currentTime,
        updatedAt: currentTime,
        deadline: deadline || undefined,
        currentNodeId: workflow.nodes[0]?.id,
        nodeStatuses,
        history: [
          {
            timestamp: currentTime,
            action: "创建了工作流Issue",
            fromUser: "当前用户",
            comment: `基于工作流 "${workflow.name}" 创建`,
          },
        ],
      };

      const issue: Issue = {
        id: issueId,
        title: title.trim(),
        description: description.trim(),
        status: "todo",
        priority,
        assignee: assignee.trim() || undefined,
        project: project.trim() || undefined,
        createdAt: currentTime,
        updatedAt: currentTime,
        type: "workflow",
        workflowData: workflowIssue,
      };

      workflowIssueStorage.save(workflowIssue);
      issueStorage.save(issue);
      onCreated(issue);
    }

    handleClose();
  };

  if (!isOpen) return null;

  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId);

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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                    onChange={(e) => setIssueType(e.target.value as "normal")}
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
                    onChange={(e) => setIssueType(e.target.value as "workflow")}
                    className="mr-2"
                  />
                  <span className="text-app-text-secondary">基于工作流</span>
                </label>
              </div>
            </div>
          )}

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
              >
                <option value="">请选择工作流...</option>
                {workflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name} ({workflow.nodes.length} 个节点)
                  </option>
                ))}
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
                    {selectedWorkflow.description}
                  </p>
                  <div className="mt-2 text-xs text-app-text-muted">
                    包含 {selectedWorkflow.nodes.length} 个节点
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-app-text-primary mb-2">
                描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入详细描述..."
                rows={3}
                className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-app-text-primary mb-2">
                优先级
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value as "urgent" | "high" | "medium" | "low"
                  )
                }
                className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>

            {workspaceType === "TEAM" && (
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  负责人
                </label>
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  placeholder="输入负责人..."
                  className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-app-text-primary mb-2">
                项目
              </label>
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="输入项目名称..."
                className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {(issueType === "workflow" ||
              issueType === "normal" ||
              workspaceType === "PERSONAL") && (
              <div>
                <label className="block text-sm font-medium text-app-text-primary mb-2">
                  截止时间
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {workspaceType === "PERSONAL" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-app-text-primary mb-2">
                    标签
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="输入标签，用逗号分隔..."
                    className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-app-text-primary mb-2">
                    备注
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="添加个人备注..."
                    rows={2}
                    className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
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
