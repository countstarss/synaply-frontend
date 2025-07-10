"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
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
  RiSendPlaneLine,
  RiAtLine,
  RiFileTextLine,
  RiHistoryLine,
} from "react-icons/ri";
import CustomNode from "../workflow/CustomNode";
// 使用新的 Issue 类型
import { Issue } from "@/lib/fetchers/issue";
import { WorkflowIssue } from "@/types/team"; // 仅复用内部结构，无需修改
import { workflowIssueStorage } from "../../utils/storage";
import { useAuth } from "@/context/AuthContext";
import { useCurrentTeam, useTeamMembers } from "@/hooks/useTeam";
import { useUpdateIssue } from "@/hooks/useIssueApi";
import { toast } from "sonner";
import { IssueStatus } from "@/types/prisma";

const nodeTypes = {
  custom: CustomNode,
};

interface Comment {
  id: string;
  content: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  mentions: string[];
}

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
  canEdit: boolean; // 是否允许编辑
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
  canEdit,
  onStatusUpdate,
  onNext,
  onPrevious,
  canNext,
  canPrevious,
}: NodeStatusUpdateProps) {
  const [comment, setComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);

  const statusOptions = [
    { value: "TODO", label: "待处理", color: "gray" },
    { value: "IN_PROGRESS", label: "进行中", color: "blue" },
    { value: "AMOST_DONE", label: "接近完成", color: "yellow" },
    { value: "DONE", label: "已完成", color: "green" },
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
                disabled={!canEdit}
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
                disabled={!canEdit || !comment.trim()}
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
            disabled={!canEdit || !canNext || currentStatus !== "DONE"}
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
  const { team } = useCurrentTeam();

  // 获取团队成员
  const { data: teamMembers = [] } = useTeamMembers(team?.id);
  const { user, session } = useAuth();
  // 解析 workflowSnapshot
  const initialWorkflowIssue = React.useMemo((): WorkflowIssue | null => {
    if (!issue.workflowSnapshot) return null;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const snapshot: Record<string, unknown> =
      typeof issue.workflowSnapshot === "string"
        ? (JSON.parse(issue.workflowSnapshot) as Record<string, unknown>)
        : (issue.workflowSnapshot as Record<string, unknown>);

    const nodes: Node[] = (snapshot as { nodes?: Node[] }).nodes || [];

    // 构建默认的 nodeStatuses
    const nodeStatuses: Record<string, { status: string }> = {};
    nodes.forEach((n: Node, idx: number) => {
      const status =
        idx < (issue.currentStepIndex || 0)
          ? "DONE"
          : idx === (issue.currentStepIndex || 0)
          ? issue.currentStepStatus || "TODO"
          : "TODO";

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const assigneeId = (n.data as { assigneeId?: string })?.assigneeId;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const assigneeName = (n.data as { assigneeName?: string })?.assigneeName;

      nodeStatuses[n.id] = {
        status,
        ...(assigneeId ? { assigneeId } : {}),
        ...(assigneeName ? { assigneeName } : {}),
      } as { status: string; assigneeId?: string; assigneeName?: string };
    });

    return {
      id: issue.id,
      title: issue.title,
      description: issue.description || "",
      workflowId: issue.workflowId || "",
      workflowName: (snapshot as { name?: string }).name || "工作流",
      priority: issue.priority || "NORMAL",
      project: undefined,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      deadline: issue.dueDate || undefined,
      currentNodeId: issue.currentStepId || nodes[0]?.id,
      nodeStatuses,
      history: [],
    } as unknown as WorkflowIssue;
  }, [issue]);

  const [workflowIssue, setWorkflowIssue] = useState<WorkflowIssue | null>(
    initialWorkflowIssue
  );
  const [activeTab, setActiveTab] = useState<"history" | "discussion">(
    "history"
  );
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      content: "工作流进度看起来不错，继续保持。",
      author: "张三",
      authorAvatar: user?.user_metadata.avatar_url as string,
      createdAt: "2024-01-10T10:30:00Z",
      mentions: [],
    },
    {
      id: "2",
      content: "这个节点需要@李四 来确认一下技术方案。",
      author: "王五",
      authorAvatar: user?.user_metadata.avatar_url as string,
      createdAt: "2024-01-10T11:15:00Z",
      mentions: ["李四"],
    },
  ]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // 直接使用 snapshot 作为 workflow 数据
  const workflow = React.useMemo(() => {
    if (!issue.workflowSnapshot) return null;
    return typeof issue.workflowSnapshot === "string"
      ? JSON.parse(issue.workflowSnapshot)
      : issue.workflowSnapshot;
  }, [issue.workflowSnapshot]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    setCommentText(value);
    setCursorPosition(cursorPos);

    // MARK: 检测@符号
    const atIndex = value.lastIndexOf("@", cursorPos);
    if (atIndex !== -1 && (atIndex === 0 || value[atIndex - 1] === " ")) {
      const query = value.substring(atIndex + 1, cursorPos);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentionList(true);
        return;
      }
    }
    setShowMentionList(false);
  };

  // MARK: @用户选择
  const handleMentionSelect = (member: (typeof teamMembers)[0]) => {
    const atIndex = commentText.lastIndexOf("@", cursorPosition);
    const beforeAt = commentText.substring(0, atIndex);
    const afterCursor = commentText.substring(cursorPosition);
    const newText = `${beforeAt}@${member.user?.name} ${afterCursor}`;

    setCommentText(newText);
    setShowMentionList(false);
    setMentionQuery("");

    // 重新聚焦到输入框
    setTimeout(() => {
      if (commentInputRef.current) {
        const newCursorPos = atIndex + (member.user?.name?.length || 0) + 2;
        commentInputRef.current.focus();
        commentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // MARK: 发送评论
  const handleSendComment = () => {
    if (!commentText.trim()) return;

    // 提取@提及的用户
    const mentions =
      commentText.match(/@(\w+)/g)?.map((mention) => mention.substring(1)) ||
      [];

    const newComment: Comment = {
      id: Date.now().toString(),
      content: commentText,
      author: user?.user_metadata.name as string,
      authorAvatar: user?.user_metadata.avatar_url as string,
      createdAt: new Date().toISOString(),
      mentions,
    };

    setComments([...comments, newComment]);
    setCommentText("");
    setShowMentionList(false);
  };

  const filteredMembers = teamMembers.filter((member) =>
    member.user?.name?.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  // Convert workflow nodes to ReactFlow nodes with status visualization
  const { nodes, edges } = useMemo(() => {
    if (!workflow || !workflowIssue) {
      return { nodes: [], edges: [] };
    }

    const flowNodes: Node[] = workflow.nodes.map((node: Node) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeStatus = workflowIssue.nodeStatuses[node.id] as any;
      const isCurrentNode = workflowIssue.currentNodeId === node.id;

      return {
        ...node,
        data: {
          ...node.data,
          status: nodeStatus?.status || "todo",
          // 优先使用 nodeStatus.assignee，其次使用原 node.data.assignee
          assigneeId:
            nodeStatus?.assigneeId ||
            (node.data as { assigneeId?: string })?.assigneeId,
          assigneeName:
            nodeStatus?.assigneeName ||
            (node.data as { assigneeName?: string })?.assigneeName,
          // 兼容 CustomNode 的旧 assignee 字段
          assignee:
            nodeStatus?.assigneeName ||
            (node.data as { assigneeName?: string })?.assigneeName,
          isCurrentNode, // 添加当前节点标识
        },
        className: isCurrentNode ? "ring-2 ring-blue-500" : "",
        // 移除 style 属性，让 CustomNode 组件自己处理颜色
      };
    });

    const flowEdges: Edge[] = workflow.edges.map((edge: Edge) => ({
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
    return workflow.nodes.find(
      (n: Node) => n.id === workflowIssue.currentNodeId
    );
  }, [workflow, workflowIssue]);

  const updateIssueMutation = useUpdateIssue();

  const handleStatusUpdate = useCallback(
    async (nodeId: string, status: string) => {
      if (!workflowIssue) return;

      // 权限校验
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeStatus = workflowIssue.nodeStatuses[nodeId] as any;
      if (nodeStatus?.assigneeId && nodeStatus.assigneeId !== user?.id) {
        alert("只有当前节点负责人才能更新状态");
        return;
      }

      const prevIssue = { ...workflowIssue } as WorkflowIssue;

      // 构造乐观更新数据
      const optimisticIssue: WorkflowIssue = {
        ...workflowIssue,
        nodeStatuses: {
          ...workflowIssue.nodeStatuses,
          [nodeId]: {
            ...workflowIssue.nodeStatuses[nodeId],
            status,
          },
        },
        updatedAt: new Date().toISOString(),
      } as WorkflowIssue;

      setWorkflowIssue(optimisticIssue);

      const currentIndex = workflow.nodes.findIndex(
        (n: Node) => n.id === optimisticIssue.currentNodeId
      );

      try {
        await updateIssueMutation.mutateAsync({
          workspaceId: issue.workspaceId,
          issueId: issue.id,
          data: {
            currentStepId: optimisticIssue.currentNodeId,
            currentStepIndex: currentIndex,
            currentStepStatus: status as IssueStatus,
          },
        });
        onUpdate();
      } catch (error) {
        console.error(error);
        // 回滚
        setWorkflowIssue(prevIssue);
        toast.error("节点状态同步失败");
      }
    },
    [workflowIssue, issue, onUpdate, workflow, updateIssueMutation, user?.id]
  );

  // MARK: handleNext
  const handleNext = useCallback(async () => {
    if (!workflow || !workflowIssue || !currentNode) return;

    // 权限校验：仅负责人可执行
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currStatus = workflowIssue.nodeStatuses[currentNode.id] as any;
    if (currStatus?.assigneeId && currStatus.assigneeId !== user?.id) {
      alert("只有当前节点负责人才能执行此操作");
      return;
    }

    const nextEdge = workflow.edges.find(
      (e: Edge) => e.source === currentNode.id
    );
    if (!nextEdge) return;

    const updatedIssue: WorkflowIssue = {
      ...workflowIssue,
      currentNodeId: nextEdge.target,
      history: [
        ...workflowIssue.history,
        {
          timestamp: new Date().toISOString(),
          action: "移动到下一个节点",
          nodeId: nextEdge.target,
          fromUser: user?.user_metadata.name || "当前用户",
        },
      ],
      updatedAt: new Date().toISOString(),
    } as WorkflowIssue;

    setWorkflowIssue(updatedIssue);
    workflowIssueStorage.save(updatedIssue);

    // 同步后端
    try {
      if (session?.access_token) {
        const nextIndex = workflow.nodes.findIndex(
          (n: Node) => n.id === nextEdge.target
        );

        await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_DEV_URL || "http://localhost:5678"
          }/workspaces/${issue.workspaceId}/issues/${issue.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              currentStepId: nextEdge.target,
              currentStepIndex: nextIndex,
              currentStepStatus: "TODO",
            }),
          }
        );
      }
    } catch (err) {
      console.error("同步后端失败", err);
    }

    onUpdate();
  }, [
    workflow,
    workflowIssue,
    currentNode,
    issue,
    onUpdate,
    session?.access_token,
    user?.id,
  ]);

  // MARK: handlePrevious
  const handlePrevious = useCallback(async () => {
    if (!workflow || !workflowIssue || !currentNode) return;

    // 权限校验
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currStatus = workflowIssue.nodeStatuses[currentNode.id] as any;
    if (currStatus?.assigneeId && currStatus.assigneeId !== user?.id) {
      alert("只有当前节点负责人才能执行此操作");
      return;
    }

    const prevEdge = workflow.edges.find(
      (e: Edge) => e.target === currentNode.id
    );
    if (!prevEdge) return;

    const updatedIssue: WorkflowIssue = {
      ...workflowIssue,
      currentNodeId: prevEdge.source,
      history: [
        ...workflowIssue.history,
        {
          timestamp: new Date().toISOString(),
          action: "返回到上一个节点",
          nodeId: prevEdge.source,
          fromUser: user?.user_metadata.name || "当前用户",
        },
      ],
      updatedAt: new Date().toISOString(),
    } as WorkflowIssue;

    setWorkflowIssue(updatedIssue);
    workflowIssueStorage.save(updatedIssue);

    // 同步后端
    try {
      if (session?.access_token) {
        const prevIndex = workflow.nodes.findIndex(
          (n: Node) => n.id === prevEdge.source
        );

        await fetch(
          `${
            process.env.NEXT_PUBLIC_BACKEND_DEV_URL || "http://localhost:5678"
          }/workspaces/${issue.workspaceId}/issues/${issue.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              currentStepId: prevEdge.source,
              currentStepIndex: prevIndex,
              currentStepStatus: "TODO",
            }),
          }
        );
      }
    } catch (err) {
      console.error("同步后端失败", err);
    }

    onUpdate();
  }, [
    workflow,
    workflowIssue,
    currentNode,
    issue,
    onUpdate,
    session?.access_token,
    user?.id,
  ]);

  // MARK: canNext
  const canNext = useMemo(() => {
    if (!workflow || !currentNode) return false;
    return workflow.edges.some((e: Edge) => e.source === currentNode.id);
  }, [workflow, currentNode]);

  // MARK: canPrevious
  const canPrevious = useMemo(() => {
    if (!workflow || !currentNode) return false;
    return workflow.edges.some((e: Edge) => e.target === currentNode.id);
  }, [workflow, currentNode]);

  if (!workflowIssue || !workflow) {
    return (
      <div className="text-center py-8">
        <p className="text-app-text-muted">加载工作流数据失败</p>
      </div>
    );
  }

  const currentNodeStatus = workflowIssue.nodeStatuses[
    workflowIssue.currentNodeId || ""
  ] as {
    status: string;
    assigneeId?: string;
    assigneeName?: string;
  };

  const isCurrentAssignee = currentNodeStatus?.assigneeId === user?.id;

  return (
    <div className="h-full flex flex-col gap-2">
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
      <div className="flex-1 gap-2 min-h-0 flex flex-row">
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
              nodesDraggable={false} // 禁止节点拖动
              nodesConnectable={false} // 禁止创建新连接
              elementsSelectable={true} // 允许选择元素，但不允许修改
              zoomOnDoubleClick={false} // 禁止双击缩放
              edgesFocusable={false} // 边不可聚焦
              edgesUpdatable={false} // 边不可更新
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
        <div className="flex flex-col h-full gap-2 flex-1">
          {currentNode && (
            <NodeStatusUpdate
              nodeId={currentNode.id}
              currentStatus={currentNodeStatus?.status || "TODO"}
              assignee={currentNodeStatus?.assigneeName}
              canEdit={isCurrentAssignee}
              onStatusUpdate={handleStatusUpdate}
              onNext={handleNext}
              onPrevious={handlePrevious}
              canNext={canNext}
              canPrevious={canPrevious}
            />
          )}

          {/* Tabs for History and Discussion */}
          <div className="flex-1 bg-app-content-bg rounded-lg border border-app-border flex flex-col">
            {/* Tab Header */}
            <div className="p-4 border-b border-app-border flex-shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                    activeTab === "history"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-app-text-secondary hover:text-app-text-primary hover:bg-app-button-hover"
                  }`}
                >
                  <RiHistoryLine className="w-4 h-4" />
                  操作历史
                </button>
                <button
                  onClick={() => setActiveTab("discussion")}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                    activeTab === "discussion"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-app-text-secondary hover:text-app-text-primary hover:bg-app-button-hover"
                  }`}
                >
                  <RiFileTextLine className="w-4 h-4" />
                  讨论 ({comments.length})
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "history" ? (
                <div className="h-full p-4 overflow-y-auto">
                  <div className="space-y-3 h-[calc(700px)] overflow-y-auto">
                    {workflowIssue.history.map((entry, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 text-sm"
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-app-text-primary">
                            {entry.action}
                          </p>
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
              ) : (
                <div className="h-full flex flex-col">
                  {/* Discussion Content */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4 mb-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm flex-shrink-0 overflow-hidden">
                            {comment.authorAvatar ? (
                              <img
                                src={comment.authorAvatar}
                                alt="avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm">
                                {comment.author[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-app-text-primary">
                                {comment.author}
                              </span>
                              <span className="text-xs text-app-text-muted">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <div className="text-sm text-app-text-secondary">
                              {comment.content
                                .split(/(@\w+)/)
                                .map((part, index) => (
                                  <span
                                    key={index}
                                    className={
                                      part.startsWith("@")
                                        ? "text-blue-600 font-medium"
                                        : ""
                                    }
                                  >
                                    {part}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comment Input */}
                  <div className="p-4 border-t border-app-border">
                    <div className="relative">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm flex-shrink-0 overflow-hidden">
                          {user?.user_metadata.avatar_url ? (
                            <img
                              src={user?.user_metadata.avatar_url}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm">
                              {user?.user_metadata.name?.[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 relative">
                          <textarea
                            ref={commentInputRef}
                            value={commentText}
                            onChange={handleCommentChange}
                            placeholder="添加评论... 使用@提及团队成员"
                            className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                          />

                          {/* @提及列表 */}
                          {showMentionList && (
                            <div className="absolute bottom-full left-0 right-0 mt-1 bg-app-content-bg border border-app-border rounded-md shadow-lg z-10 overflow-y-auto">
                              {filteredMembers.map((member) => (
                                <button
                                  key={member.id}
                                  onClick={() => handleMentionSelect(member)}
                                  className="w-full px-3 py-2 text-left hover:bg-app-button-hover flex items-center gap-2"
                                >
                                  <span className="text-lg">
                                    {member.user?.avatar_url}
                                  </span>
                                  <div>
                                    <div className="text-sm font-medium text-app-text-primary">
                                      {member.user?.name}
                                    </div>
                                    <div className="text-xs text-app-text-muted">
                                      {member.user?.email}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-2 text-xs text-app-text-muted">
                              <RiAtLine className="w-3 h-3" />
                              <span>使用@提及团队成员</span>
                            </div>
                            <button
                              onClick={handleSendComment}
                              disabled={!commentText.trim()}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <RiSendPlaneLine className="w-3 h-3" />
                              发送
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
    <div className="fixed inset-0 w-full  dark:bg-black/50 bg-white/80 flex items-center justify-center z-50">
      <div className="bg-app-bg rounded-lg shadow-xl w-full max-w-screen h-[calc(100vh-56px)] overflow-hidden">
        <div className="h-full p-2">
          <ReactFlowProvider>
            <WorkflowIssueDetailFlow {...props} />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
