"use client";

import React, { useState, useCallback, useMemo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  RiCloseLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiMessageLine,
} from "react-icons/ri";
import CustomNode from "./CustomNode";
import { WorkflowIssue, Issue } from "../../../../../types/team";
import {
  workflowIssueStorage,
  issueStorage,
  workflowStorage,
} from "../utils/storage";

const nodeTypes = {
  custom: CustomNode,
};

interface WorkflowIssueDetailProps {
  issue: Issue;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface NodeStatusUpdateProps {
  nodeId: string;
  currentStatus: string;
  assignee?: string;
  onStatusUpdate: (nodeId: string, status: string, comment?: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  canNext: boolean;
  canPrevious: boolean;
}

function NodeStatusUpdate({
  nodeId,
  currentStatus,
  assignee,
  onStatusUpdate,
  onNext,
  onPrevious,
  canNext,
  canPrevious,
}: NodeStatusUpdateProps) {
  const [comment, setComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);

  const statusOptions = [
    { value: "todo", label: "待处理", color: "gray" },
    { value: "in_progress", label: "进行中", color: "blue" },
    { value: "almost", label: "接近完成", color: "yellow" },
    { value: "done", label: "已完成", color: "green" },
  ];

  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== currentStatus) {
      onStatusUpdate(nodeId, newStatus, comment.trim() || undefined);
      setComment("");
      setShowCommentInput(false);
    }
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      onStatusUpdate(nodeId, currentStatus, comment.trim());
      setComment("");
      setShowCommentInput(false);
    }
  };

  return (
    <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
      <h3 className="text-lg font-semibold text-app-text-primary mb-4">
        节点状态更新
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-app-text-primary mb-2">
            当前负责人: {assignee || "未分配"}
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-app-text-primary mb-2">
            状态
          </label>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={`p-2 text-sm rounded border transition-colors ${
                  currentStatus === option.value
                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-600"
                    : "bg-app-bg hover:bg-app-button-hover border-app-border"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-app-text-primary">
              添加备注
            </label>
            <button
              onClick={() => setShowCommentInput(!showCommentInput)}
              className="p-1 hover:bg-app-button-hover rounded transition-colors"
            >
              <RiMessageLine className="w-4 h-4 text-app-text-secondary" />
            </button>
          </div>
          {showCommentInput && (
            <div className="space-y-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="输入备注..."
                rows={3}
                className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddComment}
                disabled={!comment.trim()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded transition-colors disabled:cursor-not-allowed"
              >
                添加备注
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t border-app-border">
          <button
            onClick={onPrevious}
            disabled={!canPrevious}
            className="flex items-center gap-2 px-3 py-2 text-sm text-app-text-secondary hover:text-app-text-primary disabled:opacity-50 disabled:cursor-not-allowed border border-app-border rounded transition-colors"
          >
            <RiArrowLeftLine className="w-4 h-4" />
            上一步
          </button>
          <button
            onClick={onNext}
            disabled={!canNext || currentStatus !== "done"}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors disabled:cursor-not-allowed"
          >
            下一步
            <RiArrowRightLine className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkflowIssueDetailFlow({
  issue,
  onClose,
  onUpdate,
}: WorkflowIssueDetailProps) {
  const [workflowIssue, setWorkflowIssue] = useState<WorkflowIssue | null>(
    issue.workflowData || null
  );

  const workflow = useMemo(() => {
    if (!workflowIssue) return null;
    return workflowStorage.getById(workflowIssue.workflowId);
  }, [workflowIssue]);

  // Convert workflow nodes to ReactFlow nodes with status visualization
  const { nodes, edges } = useMemo(() => {
    if (!workflow || !workflowIssue) {
      return { nodes: [], edges: [] };
    }

    const flowNodes: Node[] = workflow.nodes.map((node) => {
      const nodeStatus = workflowIssue.nodeStatuses[node.id];
      const isCurrentNode = workflowIssue.currentNodeId === node.id;

      return {
        ...node,
        data: {
          ...node.data,
          status: nodeStatus?.status || "todo",
          assignee: nodeStatus?.assignee,
          isCurrentNode, // 添加当前节点标识
        },
        className: isCurrentNode ? "ring-2 ring-blue-500" : "",
        // 移除 style 属性，让 CustomNode 组件自己处理颜色
      };
    });

    const flowEdges: Edge[] = workflow.edges.map((edge) => ({
      ...edge,
      animated: false,
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [workflow, workflowIssue]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);

  // Update flow nodes when nodes change
  React.useEffect(() => {
    setFlowNodes(nodes);
    setFlowEdges(edges);
  }, [nodes, edges, setFlowNodes, setFlowEdges]);

  const currentNode = useMemo(() => {
    if (!workflowIssue || !workflow) return null;
    return workflow.nodes.find((n) => n.id === workflowIssue.currentNodeId);
  }, [workflow, workflowIssue]);

  const handleStatusUpdate = useCallback(
    (nodeId: string, status: string, comment?: string) => {
      if (!workflowIssue) return;

      const updatedIssue = {
        ...workflowIssue,
        nodeStatuses: {
          ...workflowIssue.nodeStatuses,
          [nodeId]: {
            ...workflowIssue.nodeStatuses[nodeId],
            status: status as "todo" | "in_progress" | "almost" | "done",
            ...(status === "in_progress" &&
            !workflowIssue.nodeStatuses[nodeId]?.startedAt
              ? { startedAt: new Date().toISOString() }
              : {}),
            ...(status === "done"
              ? { completedAt: new Date().toISOString() }
              : {}),
            ...(comment
              ? {
                  comments: [
                    ...(workflowIssue.nodeStatuses[nodeId]?.comments || []),
                    comment,
                  ],
                }
              : {}),
          },
        },
        history: [
          ...workflowIssue.history,
          {
            timestamp: new Date().toISOString(),
            action: `更新节点状态为: ${status}`,
            nodeId,
            fromUser: "当前用户",
            comment,
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      setWorkflowIssue(updatedIssue);
      workflowIssueStorage.save(updatedIssue);

      // Update main issue
      const updatedMainIssue = {
        ...issue,
        workflowData: updatedIssue,
        updatedAt: new Date().toISOString(),
      };
      issueStorage.save(updatedMainIssue);

      onUpdate();
    },
    [workflowIssue, issue, onUpdate]
  );

  const handleNext = useCallback(() => {
    if (!workflow || !workflowIssue || !currentNode) return;

    // Find next node based on edges
    const nextEdge = workflow.edges.find((e) => e.source === currentNode.id);
    if (nextEdge) {
      const updatedIssue = {
        ...workflowIssue,
        currentNodeId: nextEdge.target,
        history: [
          ...workflowIssue.history,
          {
            timestamp: new Date().toISOString(),
            action: "移动到下一个节点",
            nodeId: nextEdge.target,
            fromUser: "当前用户",
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      setWorkflowIssue(updatedIssue);
      workflowIssueStorage.save(updatedIssue);

      const updatedMainIssue = {
        ...issue,
        workflowData: updatedIssue,
        updatedAt: new Date().toISOString(),
      };
      issueStorage.save(updatedMainIssue);

      onUpdate();
    }
  }, [workflow, workflowIssue, currentNode, issue, onUpdate]);

  const handlePrevious = useCallback(() => {
    if (!workflow || !workflowIssue || !currentNode) return;

    // Find previous node based on edges
    const prevEdge = workflow.edges.find((e) => e.target === currentNode.id);
    if (prevEdge) {
      const updatedIssue = {
        ...workflowIssue,
        currentNodeId: prevEdge.source,
        history: [
          ...workflowIssue.history,
          {
            timestamp: new Date().toISOString(),
            action: "返回到上一个节点",
            nodeId: prevEdge.source,
            fromUser: "当前用户",
          },
        ],
        updatedAt: new Date().toISOString(),
      };

      setWorkflowIssue(updatedIssue);
      workflowIssueStorage.save(updatedIssue);

      const updatedMainIssue = {
        ...issue,
        workflowData: updatedIssue,
        updatedAt: new Date().toISOString(),
      };
      issueStorage.save(updatedMainIssue);

      onUpdate();
    }
  }, [workflow, workflowIssue, currentNode, issue, onUpdate]);

  const canNext = useMemo(() => {
    if (!workflow || !currentNode) return false;
    return workflow.edges.some((e) => e.source === currentNode.id);
  }, [workflow, currentNode]);

  const canPrevious = useMemo(() => {
    if (!workflow || !currentNode) return false;
    return workflow.edges.some((e) => e.target === currentNode.id);
  }, [workflow, currentNode]);

  if (!workflowIssue || !workflow) {
    return (
      <div className="text-center py-8">
        <p className="text-app-text-muted">加载工作流数据失败</p>
      </div>
    );
  }

  const currentNodeStatus =
    workflowIssue.nodeStatuses[workflowIssue.currentNodeId || ""];

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Issue Info */}
      <div className="bg-app-content-bg rounded-lg border border-app-border p-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-app-text-primary mb-2">
              {issue.title}
            </h2>
            {/* <p className="text-app-text-secondary mb-2">{issue.description}</p> */}
            <div className="flex items-center gap-4 text-sm text-app-text-muted">
              <span>工作流: {workflowIssue.workflowName}</span>
              <span>优先级: {issue.priority}</span>
              {issue.assignee && <span>负责人: {issue.assignee}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-app-button-hover rounded-lg transition-colors"
          >
            <RiCloseLine className="w-5 h-5 text-app-text-secondary" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 gap-4 min-h-0 flex flex-row">
        {/* Workflow Visualization */}
        <div className="bg-app-content-bg rounded-lg border border-app-border flex flex-col flex-2">
          <div className="p-4 border-b border-app-border flex-shrink-0">
            <h3 className="text-lg font-semibold text-app-text-primary">
              工作流进度
            </h3>
          </div>
          <div className="flex-1 min-h-0">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Controls className="!bg-app-content-bg !border-app-border" />
              <MiniMap className="!bg-app-content-bg !border-app-border" />
              <Background
                variant={BackgroundVariant.Dots}
                gap={12}
                size={1}
                className="!bg-transparent"
              />
            </ReactFlow>
          </div>
        </div>

        {/* Current Node Control */}
        <div className="flex flex-col h-full gap-4 flex-1">
          {currentNode && (
            <NodeStatusUpdate
              nodeId={currentNode.id}
              currentStatus={currentNodeStatus?.status || "todo"}
              assignee={currentNodeStatus?.assignee}
              onStatusUpdate={handleStatusUpdate}
              onNext={handleNext}
              onPrevious={handlePrevious}
              canNext={canNext}
              canPrevious={canPrevious}
            />
          )}

          {/* Workflow History */}
          <div className="flex-1 bg-app-content-bg rounded-lg border border-app-border flex flex-col">
            <div className="p-4 border-b border-app-border flex-shrink-0">
              <h3 className="text-lg font-semibold text-app-text-primary">
                操作历史
              </h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3">
                {workflowIssue.history
                  .slice(-10)
                  .reverse()
                  .map((entry, index) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-app-text-primary">{entry.action}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-app-text-muted">
                          <span>{entry.fromUser}</span>
                          <span>•</span>
                          <span>
                            {new Date(entry.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {entry.comment && (
                          <p className="mt-1 text-xs text-app-text-secondary bg-app-button-hover rounded px-2 py-1">
                            {entry.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                {workflowIssue.history.length === 0 && (
                  <div className="text-center text-app-text-muted py-8">
                    暂无操作历史
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowIssueDetail(props: WorkflowIssueDetailProps) {
  if (!props.isOpen) return null;

  return (
    <div className="fixed inset-0 dark:bg-black/50 bg-white/80 flex items-center justify-center z-50">
      <div className="bg-app-bg rounded-lg shadow-xl w-[95vw] h-[95vh] overflow-hidden">
        <div className="h-full p-4">
          <ReactFlowProvider>
            <WorkflowIssueDetailFlow {...props} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
