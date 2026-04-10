"use client";

import React, { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { RiCloseLine, RiFileTextLine, RiHistoryLine } from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import {
  useAcceptWorkflowHandoff,
  useBlockWorkflowRun,
  useIssueActivities,
  useRespondWorkflowReview,
  useIssueStepRecords,
  useRequestWorkflowHandoff,
  useRequestWorkflowReview,
  useUnblockWorkflowRun,
} from "@/hooks/useIssueApi";
import { useIssueRealtime } from "@/hooks/realtime/useIssueRealtime";
import { useCurrentTeam, useTeamMembers } from "@/hooks/useTeam";
import { Issue } from "@/lib/fetchers/issue";
import useWorkflowNodeStatus from "@/app/[locale]/(main)/workflows/_components/hooks/useWorkflowNodeStatus";
import {
  createFlowNodesAndEdges,
  createInitialWorkflowIssue,
  parseWorkflowSnapshot,
} from "@/app/[locale]/(main)/workflows/_components/utils/workflowUtils";
import { WorkflowIssue } from "@/types/team";
import { NodeStatusUpdate } from "./NodeStatusUpdate";
import { RecordModal } from "./RecordModal";
import { DiscussionTab, HistoryTab, RecordsTab } from "./tabs";
import CustomNode from "../workflow/CustomNode";
import { toast } from "sonner";

const nodeTypes = {
  custom: CustomNode,
};

const RUN_STATUS_LABELS = {
  ACTIVE: "执行中",
  BLOCKED: "已阻塞",
  WAITING_REVIEW: "等待评审",
  HANDOFF_PENDING: "等待交接",
  DONE: "已完成",
} as const;

const ACTION_TYPE_LABELS = {
  execution: "当前在执行步骤",
  blocked: "等待解阻",
  review: "等待确认",
  handoff: "等待接手",
  done: "流程已完成",
} as const;

const REVIEW_OUTCOME_LABELS = {
  APPROVED: "已确认",
  CHANGES_REQUESTED: "需修改",
} as const;

export interface WorkflowIssueDetailProps {
  issue: Issue;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function WorkflowIssueDetailFlow({
  issue,
  onClose,
  onUpdate,
}: WorkflowIssueDetailProps) {
  const { team } = useCurrentTeam();
  const { data: teamMembers = [] } = useTeamMembers(team?.id);
  const { user, session } = useAuth();
  const {
    getFocusedUsersForNode,
    setFocusingNode,
  } = useIssueRealtime(issue.id, issue.workspaceId, {
    enabled: true,
    workflow: true,
  });

  const initialWorkflowIssue = React.useMemo(
    () => createInitialWorkflowIssue(issue),
    [issue],
  );

  const workflow = React.useMemo(
    () => parseWorkflowSnapshot(issue.workflowSnapshot),
    [issue.workflowSnapshot],
  );

  const [workflowIssue, setWorkflowIssue] = useState<WorkflowIssue | null>(
    initialWorkflowIssue,
  );
  const [workflowPanelTab, setWorkflowPanelTab] = useState<"overview" | "canvas">(
    "canvas",
  );
  const [activeTab, setActiveTab] = useState<"history" | "discussion" | "records">(
    "history",
  );
  const [collaborationTargetId, setCollaborationTargetId] = useState("");
  const [collaborationNote, setCollaborationNote] = useState("");

  const { data: stepRecords = [] } = useIssueStepRecords(
    issue.workspaceId,
    issue.id,
  );
  const { data: activities = [] } = useIssueActivities(
    issue.workspaceId,
    issue.id,
  );
  const blockWorkflowRunMutation = useBlockWorkflowRun();
  const unblockWorkflowRunMutation = useUnblockWorkflowRun();
  const requestWorkflowReviewMutation = useRequestWorkflowReview();
  const requestWorkflowHandoffMutation = useRequestWorkflowHandoff();
  const respondWorkflowReviewMutation = useRespondWorkflowReview();
  const acceptWorkflowHandoffMutation = useAcceptWorkflowHandoff();

  const { nodes, edges } = useMemo(
    () => createFlowNodesAndEdges(workflow, workflowIssue),
    [workflow, workflowIssue],
  );

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);

  React.useEffect(() => {
    setFlowNodes(nodes);
    setFlowEdges(edges);
  }, [nodes, edges, setFlowNodes, setFlowEdges]);

  React.useEffect(() => {
    setWorkflowIssue(initialWorkflowIssue);
  }, [initialWorkflowIssue]);

  const currentNode = useMemo(() => {
    if (!workflowIssue || !workflow) return null;
    return workflow.nodes.find(
      (node: Node) => node.id === workflowIssue.currentNodeId,
    );
  }, [workflow, workflowIssue]);
  const workflowMembers = useMemo(
    () =>
      teamMembers.map((member) => ({
        id: member.id,
        userId: member.user?.id,
        name:
          member.user?.name?.trim() ||
          member.user?.email?.split("@")[0] ||
          `成员 ${member.id.slice(0, 6)}`,
        email: member.user?.email,
        avatarUrl: member.user?.avatar_url || member.user?.avatarUrl,
      })),
    [teamMembers],
  );
  const workflowRun = issue.workflowRun;
  const selectedCollaborationTarget =
    workflowMembers.find((member) => member.id === collaborationTargetId) || null;

  const {
    handleStatusUpdate,
    handleNext,
    handlePrevious,
    handleSubmitRecord,
    isRecordModalOpen,
    setIsRecordModalOpen,
    canNext,
    canPrevious,
  } = useWorkflowNodeStatus({
    issue,
    workflow,
    workflowIssue,
    setWorkflowIssue,
    currentNode,
    user,
    session,
    onUpdate,
  });

  const resetCollaborationInputs = React.useCallback(() => {
    setCollaborationTargetId("");
    setCollaborationNote("");
  }, []);

  React.useEffect(() => {
    resetCollaborationInputs();
  }, [issue.id, resetCollaborationInputs]);

  const handleRequestReview = React.useCallback(async () => {
    if (!currentNode) {
      return;
    }

    try {
      await requestWorkflowReviewMutation.mutateAsync({
        workspaceId: issue.workspaceId,
        issueId: issue.id,
        data: {
          targetUserId: selectedCollaborationTarget?.userId,
          targetName: selectedCollaborationTarget?.name,
          comment: collaborationNote.trim() || undefined,
        },
      });
      resetCollaborationInputs();
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "请求评审失败");
    }
  }, [
    collaborationNote,
    currentNode,
    issue.id,
    issue.workspaceId,
    onUpdate,
    requestWorkflowReviewMutation,
    resetCollaborationInputs,
    selectedCollaborationTarget?.name,
    selectedCollaborationTarget?.userId,
  ]);

  const handleRequestHandoff = React.useCallback(async () => {
    if (!currentNode) {
      return;
    }

    try {
      await requestWorkflowHandoffMutation.mutateAsync({
        workspaceId: issue.workspaceId,
        issueId: issue.id,
        data: {
          targetUserId: selectedCollaborationTarget?.userId,
          targetName: selectedCollaborationTarget?.name,
          comment: collaborationNote.trim() || undefined,
        },
      });
      resetCollaborationInputs();
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "请求交接失败");
    }
  }, [
    collaborationNote,
    currentNode,
    issue.id,
    issue.workspaceId,
    onUpdate,
    requestWorkflowHandoffMutation,
    resetCollaborationInputs,
    selectedCollaborationTarget?.name,
    selectedCollaborationTarget?.userId,
  ]);

  const handleBlockRun = React.useCallback(async () => {
    try {
      await blockWorkflowRunMutation.mutateAsync({
        workspaceId: issue.workspaceId,
        issueId: issue.id,
        data: {
          reason: collaborationNote.trim() || undefined,
        },
      });
      setCollaborationNote("");
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "标记阻塞失败");
    }
  }, [
    blockWorkflowRunMutation,
    collaborationNote,
    issue.id,
    issue.workspaceId,
    onUpdate,
  ]);

  const handleUnblockRun = React.useCallback(async () => {
    try {
      await unblockWorkflowRunMutation.mutateAsync({
        workspaceId: issue.workspaceId,
        issueId: issue.id,
        data: {
          comment: collaborationNote.trim() || undefined,
        },
      });
      setCollaborationNote("");
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "解除阻塞失败");
    }
  }, [
    collaborationNote,
    issue.id,
    issue.workspaceId,
    onUpdate,
    unblockWorkflowRunMutation,
  ]);

  React.useEffect(() => {
    setFocusingNode(currentNode?.id || null);
  }, [currentNode?.id, setFocusingNode]);

  const handleApproveReview = React.useCallback(async () => {
    try {
      await respondWorkflowReviewMutation.mutateAsync({
        workspaceId: issue.workspaceId,
        issueId: issue.id,
        data: {
          outcome: "APPROVED",
          comment: collaborationNote.trim() || undefined,
        },
      });
      setCollaborationNote("");
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "确认评审失败");
    }
  }, [
    collaborationNote,
    issue.id,
    issue.workspaceId,
    onUpdate,
    respondWorkflowReviewMutation,
  ]);

  const handleRequestChanges = React.useCallback(async () => {
    try {
      await respondWorkflowReviewMutation.mutateAsync({
        workspaceId: issue.workspaceId,
        issueId: issue.id,
        data: {
          outcome: "CHANGES_REQUESTED",
          comment: collaborationNote.trim() || undefined,
        },
      });
      setCollaborationNote("");
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "退回修改失败");
    }
  }, [
    collaborationNote,
    issue.id,
    issue.workspaceId,
    onUpdate,
    respondWorkflowReviewMutation,
  ]);

  const handleAcceptHandoff = React.useCallback(async () => {
    try {
      await acceptWorkflowHandoffMutation.mutateAsync({
        workspaceId: issue.workspaceId,
        issueId: issue.id,
        data: {
          comment: collaborationNote.trim() || undefined,
        },
      });
      setCollaborationNote("");
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "接受交接失败");
    }
  }, [
    acceptWorkflowHandoffMutation,
    collaborationNote,
    issue.id,
    issue.workspaceId,
    onUpdate,
  ]);

  if (!workflowIssue || !workflow) {
    return (
      <Card className="border-app-border bg-app-content-bg shadow-none">
        <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="text-app-text-muted">加载工作流数据失败</div>
          <Button
            type="button"
            variant="outline"
            className="border-app-border bg-transparent text-app-text-primary"
            onClick={onClose}
          >
            返回列表
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentNodeStatus = workflowIssue.nodeStatuses[
    workflowIssue.currentNodeId || ""
  ] as {
    status: string;
    assigneeId?: string;
    assigneeName?: string;
  };

  const isCurrentAssignee =
    (workflowRun?.currentAssigneeUserId || currentNodeStatus?.assigneeId) ===
    user?.id;
  const isPendingReviewer =
    workflowRun?.runStatus === "WAITING_REVIEW" &&
    workflowRun.targetUserId === user?.id;
  const isPendingHandoffTarget =
    workflowRun?.runStatus === "HANDOFF_PENDING" &&
    workflowRun.targetUserId === user?.id;
  const currentNodeFocusUsers = currentNode
    ? getFocusedUsersForNode(currentNode.id)
    : [];
  const currentOwnerLabel =
    workflowRun?.currentAssigneeName || currentNodeStatus?.assigneeName || "未分配";
  const pendingTargetLabel = workflowRun?.targetName || "指定成员";
  const hasSelectedTarget = Boolean(selectedCollaborationTarget?.userId);
  const canRequestCollaboration =
    Boolean(workflowRun) && workflowRun?.runStatus === "ACTIVE" && isCurrentAssignee;
  const issueMetaItems = [
    ["编号", issue.key || `#${issue.id.slice(0, 8)}`],
    ["工作流", workflowIssue.workflowName],
    ["状态", workflowRun ? RUN_STATUS_LABELS[workflowRun.runStatus] : "未开始"],
    ["当前步骤", workflowRun?.currentStepName || currentNode?.data?.label || "未命名步骤"],
    ["当前负责人", currentOwnerLabel],
    ["优先级", issue.priority || "未设置"],
    ["步骤数", workflowRun?.totalSteps ? `${workflowRun.totalSteps} 步` : `${workflow.nodes.length} 步`],
  ] as const;
  const collaborationTags = workflowRun
    ? [
        ["动作", ACTION_TYPE_LABELS[workflowRun.currentActionType]],
        ["负责人", workflowRun.currentAssigneeName || "未分配"],
        ["步骤", workflowRun.currentStepName || "未命名步骤"],
        ["版本", workflowRun.templateVersion || "v1"],
        ...(workflowRun.lastEventType === "workflow.review.approved" ||
        workflowRun.lastEventType === "workflow.review.changes_requested"
          ? [
              [
                "最近评审",
                REVIEW_OUTCOME_LABELS[
                  workflowRun.lastEventType === "workflow.review.approved"
                    ? "APPROVED"
                    : "CHANGES_REQUESTED"
                ],
              ],
            ]
          : []),
      ]
    : [];

  return (
    <div className="flex h-full flex-col gap-2">
      <Card className="flex-shrink-0 border-app-border bg-app-content-bg shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-4 p-4">
          <div className="space-y-2">
            <CardTitle className="text-xl text-app-text-primary">
              {issue.title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm text-app-text-muted">
              <Badge
                variant="secondary"
                className="bg-app-button-hover text-app-text-primary"
              >
                工作流: {workflowIssue.workflowName}
              </Badge>
              {workflowRun && (
                <Badge
                  variant="outline"
                  className="border-app-border text-app-text-primary"
                >
                  {RUN_STATUS_LABELS[workflowRun.runStatus]}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="border-app-border text-app-text-primary"
              >
                优先级: {issue.priority}
              </Badge>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-lg text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
            onClick={onClose}
          >
            <RiCloseLine className="h-5 w-5" />
          </Button>
        </CardHeader>
      </Card>

      <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_400px] xl:grid-rows-[minmax(420px,1fr)_auto] xl:overflow-hidden">
        <Tabs
          value={workflowPanelTab}
          onValueChange={(value) =>
            setWorkflowPanelTab(value as "overview" | "canvas")
          }
          className="flex min-h-[420px] flex-col overflow-hidden xl:min-h-0"
        >
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-app-border bg-app-content-bg shadow-none">
            <CardHeader className="flex flex-col gap-3 border-b border-app-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-lg text-app-text-primary">
                工作流任务
              </CardTitle>
              <TabsList
                variant="line"
                className="h-auto w-full gap-2 bg-transparent p-0 sm:w-auto"
              >
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-700"
                >
                  介绍
                </TabsTrigger>
                <TabsTrigger
                  value="canvas"
                  className="data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-700"
                >
                  Canvas
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="min-h-0 flex-1 p-0">
              <TabsContent value="overview" className="mt-0 h-full">
                <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4">
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {issueMetaItems.map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-app-border bg-app-bg px-3 py-2"
                      >
                        <div className="text-[11px] font-medium uppercase tracking-wide text-app-text-muted">
                          {label}
                        </div>
                        <div className="mt-1 truncate text-sm text-app-text-primary">
                          {String(value)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="min-h-0 flex-1 rounded-lg border border-app-border bg-app-bg p-4">
                    <div className="text-sm font-medium text-app-text-primary">
                      任务介绍
                    </div>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-app-text-secondary">
                      {issue.description?.trim() ||
                        "还没有补充介绍。建议写清背景、验收标准、交接注意事项和相关文档。"}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="canvas" className="mt-0 h-full">
                <div className="h-full min-h-0">
                  <ReactFlow
                    nodes={flowNodes}
                    edges={flowEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    nodesDraggable={false}
                    nodesConnectable={true}
                    elementsSelectable={true}
                    zoomOnDoubleClick={false}
                    edgesFocusable={false}
                    edgesUpdatable={false}
                  >
                    <Controls className="!border-app-border !bg-app-content-bg" />
                    <MiniMap className="!border-app-border !bg-app-content-bg" />
                    <Background
                      variant={BackgroundVariant.Dots}
                      gap={12}
                      size={1}
                      className="!bg-transparent"
                    />
                  </ReactFlow>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>

        <div className="flex min-h-0 flex-col gap-2 xl:col-start-1 xl:row-start-2">
          {workflowRun && (
            <Card className="border-app-border bg-app-content-bg shadow-none">
              <CardHeader className="flex flex-row items-center justify-between gap-3 p-3 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base text-app-text-primary">
                    协作状态
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="border-app-border text-xs text-app-text-primary"
                >
                  {RUN_STATUS_LABELS[workflowRun.runStatus]}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 px-3 pb-3">
                <div className="flex flex-wrap gap-2">
                  {collaborationTags.map(([label, value]) => (
                    <Badge
                      key={label}
                      variant="secondary"
                      className="rounded-md bg-app-button-hover px-2.5 py-1 text-xs font-normal text-app-text-primary"
                    >
                      {label}：{value}
                    </Badge>
                  ))}
                </div>

                {(workflowRun.blockedReason || workflowRun.targetName) && (
                  <div className="flex flex-wrap gap-2 rounded-lg border border-app-border bg-app-bg px-3 py-2 text-xs text-app-text-secondary">
                    {workflowRun.blockedReason && (
                      <span>阻塞原因：{workflowRun.blockedReason}</span>
                    )}
                    {workflowRun.targetName && (
                      <span>待处理人：{workflowRun.targetName}</span>
                    )}
                  </div>
                )}

                {workflowRun.runStatus === "ACTIVE" && (
                  <div className="space-y-2 rounded-lg border border-app-border bg-app-bg px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-app-text-primary">
                        当前由 {currentOwnerLabel} 推进
                      </div>
                      <p className="mt-1 text-xs leading-5 text-app-text-muted">
                        执行人可以请求评审、发起交接，或在需要外部帮助时标记阻塞。
                      </p>
                    </div>

                    {canRequestCollaboration ? (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm text-app-text-primary">
                            评审 / 交接对象
                          </Label>
                          <Select
                            value={collaborationTargetId || undefined}
                            onValueChange={setCollaborationTargetId}
                          >
                            <SelectTrigger className="border-app-border bg-app-content-bg text-app-text-primary">
                              <SelectValue placeholder="选择需要确认或接手的人" />
                            </SelectTrigger>
                            <SelectContent className="border-app-border bg-app-content-bg">
                              {workflowMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm text-app-text-primary">
                            协作说明
                          </Label>
                          <Textarea
                            value={collaborationNote}
                            onChange={(event) =>
                              setCollaborationNote(event.target.value)
                            }
                            rows={2}
                            placeholder="补充评审、交接或阻塞说明。标记阻塞时建议写清：原因、需要谁帮助、预计何时恢复。"
                            className="border-app-border bg-app-content-bg text-app-text-primary"
                          />
                        </div>

                        {!hasSelectedTarget && (
                          <p className="text-xs text-app-text-muted">
                            选择目标成员后才能请求评审或交接；标记阻塞可以直接提交。
                          </p>
                        )}

                        <div className="grid gap-2 sm:grid-cols-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="border-app-border bg-transparent text-app-text-primary"
                            disabled={
                              requestWorkflowReviewMutation.isPending ||
                              !hasSelectedTarget
                            }
                            onClick={handleRequestReview}
                          >
                            请求评审
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-app-border bg-transparent text-app-text-primary"
                            disabled={
                              requestWorkflowHandoffMutation.isPending ||
                              !hasSelectedTarget
                            }
                            onClick={handleRequestHandoff}
                          >
                            请求交接
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-rose-500/30 bg-transparent text-rose-600 hover:bg-rose-500/10 dark:text-rose-300"
                            disabled={blockWorkflowRunMutation.isPending}
                            onClick={handleBlockRun}
                          >
                            标记阻塞
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-lg border border-dashed border-app-border px-3 py-2 text-sm text-app-text-secondary">
                        只有当前负责人可以发起评审、交接或阻塞操作。
                      </div>
                    )}
                  </div>
                )}

                {workflowRun.runStatus === "WAITING_REVIEW" && (
                  <div className="space-y-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-app-text-primary">
                        正在等待 {pendingTargetLabel} 评审
                      </div>
                      <p className="mt-1 text-xs leading-5 text-app-text-muted">
                        评审通过后流程会继续推进；如果需要补充修改，可以直接退回。
                      </p>
                    </div>

                    {isPendingReviewer ? (
                      <>
                        <Textarea
                          value={collaborationNote}
                          onChange={(event) =>
                            setCollaborationNote(event.target.value)
                          }
                          rows={2}
                          placeholder="写下评审结论或修改建议"
                          className="border-app-border bg-app-content-bg text-app-text-primary"
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            type="button"
                            className="bg-sky-600 text-white hover:bg-sky-500"
                            disabled={respondWorkflowReviewMutation.isPending}
                            onClick={handleApproveReview}
                          >
                            通过评审
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-app-border bg-transparent text-app-text-primary"
                            disabled={respondWorkflowReviewMutation.isPending}
                            onClick={handleRequestChanges}
                          >
                            请求修改
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-lg border border-dashed border-sky-500/20 px-3 py-2 text-sm text-app-text-secondary">
                        这一步需要 {pendingTargetLabel} 处理，你可以在讨论区补充上下文。
                      </div>
                    )}
                  </div>
                )}

                {workflowRun.runStatus === "HANDOFF_PENDING" && (
                  <div className="space-y-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-app-text-primary">
                        正在等待 {pendingTargetLabel} 接手
                      </div>
                      <p className="mt-1 text-xs leading-5 text-app-text-muted">
                        接手后，当前步骤的负责人会转移到新的处理人。
                      </p>
                    </div>

                    {isPendingHandoffTarget ? (
                      <>
                        <Textarea
                          value={collaborationNote}
                          onChange={(event) =>
                            setCollaborationNote(event.target.value)
                          }
                          rows={2}
                          placeholder="写下接手说明，例如下一步准备如何推进"
                          className="border-app-border bg-app-content-bg text-app-text-primary"
                        />
                        <Button
                          type="button"
                          className="w-full bg-sky-600 text-white hover:bg-sky-500"
                          disabled={acceptWorkflowHandoffMutation.isPending}
                          onClick={handleAcceptHandoff}
                        >
                          接受交接
                        </Button>
                      </>
                    ) : (
                      <div className="rounded-lg border border-dashed border-cyan-500/20 px-3 py-2 text-sm text-app-text-secondary">
                        这一步需要 {pendingTargetLabel} 接手，你可以在讨论区补充交接上下文。
                      </div>
                    )}
                  </div>
                )}

                {workflowRun.runStatus === "BLOCKED" && (
                  <div className="space-y-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-app-text-primary">
                        当前步骤处于阻塞中
                      </div>
                      <p className="mt-1 text-xs leading-5 text-app-text-muted">
                        负责人：{currentOwnerLabel}。阻塞说明里应包含原因、需要谁帮助、预计恢复时间。
                      </p>
                    </div>

                    {isCurrentAssignee ? (
                      <>
                        <Textarea
                          value={collaborationNote}
                          onChange={(event) =>
                            setCollaborationNote(event.target.value)
                          }
                          rows={2}
                          placeholder="说明阻塞已解除的依据，或补充恢复后的下一步"
                          className="border-app-border bg-app-content-bg text-app-text-primary"
                        />
                        <Button
                          type="button"
                          className="w-full bg-sky-600 text-white hover:bg-sky-500"
                          disabled={unblockWorkflowRunMutation.isPending}
                          onClick={handleUnblockRun}
                        >
                          解除阻塞
                        </Button>
                      </>
                    ) : (
                      <div className="rounded-lg border border-dashed border-rose-500/20 px-3 py-2 text-sm text-app-text-secondary">
                        只有当前负责人可以解除阻塞；其他成员可以在讨论区补充信息。
                      </div>
                    )}
                  </div>
                )}

                {workflowRun.runStatus === "DONE" && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-app-text-secondary">
                    这个流程已经完成，后续可以在成果和讨论记录中回看交付上下文。
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentNode && isCurrentAssignee && (
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

          {currentNodeFocusUsers.length > 0 && (
            <Card className="border-app-border bg-app-content-bg shadow-none">
              <CardContent className="p-3 text-xs text-app-text-muted">
                {currentNodeFocusUsers.map((participant) => participant.name).join("、")}
                正在关注当前节点
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "history" | "discussion" | "records")
          }
          className="min-h-[420px] xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:min-h-0"
        >
          <Card className="flex h-full min-h-0 flex-col border-app-border bg-app-content-bg shadow-none">
            <CardHeader className="flex flex-col gap-3 border-b border-app-border p-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base text-app-text-primary">
                  协作记录
                </CardTitle>
              </div>
              <TabsList
                variant="line"
                className="h-auto w-full gap-2 bg-transparent p-0 sm:w-auto"
              >
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-700"
                >
                  <RiHistoryLine className="h-4 w-4" />
                  操作历史
                </TabsTrigger>
                <TabsTrigger
                  value="discussion"
                  className="data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-700"
                >
                  <RiFileTextLine className="h-4 w-4" />
                  讨论
                </TabsTrigger>
                <TabsTrigger
                  value="records"
                  className="data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-700"
                >
                  <RiFileTextLine className="h-4 w-4" />
                  成果 ({stepRecords.length})
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="min-h-0 flex-1 p-0">
              <TabsContent value="history" className="mt-0 h-full">
                <HistoryTab activities={activities} />
              </TabsContent>
              <TabsContent value="discussion" className="mt-0 h-full">
                <DiscussionTab
                  issueId={issue.id}
                  workspaceId={issue.workspaceId}
                  members={workflowMembers}
                />
              </TabsContent>
              <TabsContent value="records" className="mt-0 h-full">
                <RecordsTab records={stepRecords} />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSubmit={handleSubmitRecord}
      />
    </div>
  );
}
