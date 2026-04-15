"use client";

import React, { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
import {
  RiCloseLine,
  RiFileTextLine,
  RiHistoryLine,
  RiSparklingLine,
} from "react-icons/ri";
import { AiThreadShell } from "@/components/ai/thread/AiThreadShell";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Issue,
  type IssueActivity,
  type WorkflowRunActivityMetadata,
} from "@/lib/fetchers/issue";
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

function isWorkflowRunActivityMetadata(
  metadata: unknown,
): metadata is WorkflowRunActivityMetadata {
  if (!metadata || typeof metadata !== "object") {
    return false;
  }

  const record = metadata as Record<string, unknown>;
  return record.kind === "workflow" && typeof record.eventType === "string";
}

function getWorkflowActivityActorLabel(
  activity: IssueActivity | undefined,
  fallbackLabel: string,
) {
  return (
    activity?.actor?.user?.name?.trim() ||
    activity?.actor?.user?.email?.split("@")[0] ||
    fallbackLabel
  );
}

function getRunStatusLabels(tIssues: (key: string) => string) {
  return {
    ACTIVE: tIssues("workflowFlow.runStatus.active"),
    BLOCKED: tIssues("workflowFlow.runStatus.blocked"),
    WAITING_REVIEW: tIssues("workflowFlow.runStatus.waitingReview"),
    HANDOFF_PENDING: tIssues("workflowFlow.runStatus.handoffPending"),
    DONE: tIssues("workflowFlow.runStatus.done"),
  } as const;
}

function getActionTypeLabels(tIssues: (key: string) => string) {
  return {
    execution: tIssues("workflowFlow.actionType.execution"),
    blocked: tIssues("workflowFlow.actionType.blocked"),
    review: tIssues("workflowFlow.actionType.review"),
    handoff: tIssues("workflowFlow.actionType.handoff"),
    done: tIssues("workflowFlow.actionType.done"),
  } as const;
}

function getReviewOutcomeLabels(tIssues: (key: string) => string) {
  return {
    APPROVED: tIssues("workflowFlow.reviewOutcome.approved"),
    CHANGES_REQUESTED: tIssues("workflowFlow.reviewOutcome.changesRequested"),
  } as const;
}

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
  const tIssues = useTranslations("issues");
  const locale = useLocale();
  const { team } = useCurrentTeam();
  const { data: teamMembers = [] } = useTeamMembers(team?.id);
  const { user, session } = useAuth();
  const { getFocusedUsersForNode, setFocusingNode } = useIssueRealtime(
    issue.id,
    issue.workspaceId,
    {
      enabled: true,
      workflow: true,
    },
  );

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
  const [isAiThreadOpen, setIsAiThreadOpen] = useState(false);
  const [workflowPanelTab, setWorkflowPanelTab] = useState<
    "overview" | "canvas"
  >("canvas");
  const [activeTab, setActiveTab] = useState<
    "history" | "discussion" | "records"
  >("history");
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

  const runStatusLabels = getRunStatusLabels(tIssues);
  const actionTypeLabels = getActionTypeLabels(tIssues);
  const reviewOutcomeLabels = getReviewOutcomeLabels(tIssues);

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
          tIssues("workflowFlow.memberFallback", {
            id: member.id.slice(0, 6),
          }),
        email: member.user?.email,
        avatarUrl: member.user?.avatar_url || member.user?.avatarUrl,
      })),
    [tIssues, teamMembers],
  );
  const workflowRun = issue.workflowRun;
  const collaborationEligibleMembers = useMemo(
    () =>
      workflowMembers.filter(
        (member) => Boolean(member.userId) && member.userId !== user?.id,
      ),
    [user?.id, workflowMembers],
  );
  const selectedCollaborationTarget =
    collaborationEligibleMembers.find(
      (member) => member.id === collaborationTargetId,
    ) ||
    null;
  const latestWorkflowActivity = useMemo(
    () =>
      activities.find((activity) =>
        isWorkflowRunActivityMetadata(activity.metadata),
      ),
    [activities],
  );
  const latestWorkflowMetadata = isWorkflowRunActivityMetadata(
    latestWorkflowActivity?.metadata,
  )
    ? latestWorkflowActivity.metadata
    : null;
  const latestWorkflowContextNote =
    latestWorkflowMetadata?.reason?.trim() ||
    latestWorkflowMetadata?.comment?.trim() ||
    null;
  const latestWorkflowActorLabel = getWorkflowActivityActorLabel(
    latestWorkflowActivity,
    tIssues("workflowFlow.meta.unassigned"),
  );
  const latestWorkflowContextMeta =
    latestWorkflowActivity?.createdAt && latestWorkflowContextNote
      ? tIssues("workflowFlow.collaboration.latestNoteMeta", {
          name: latestWorkflowActorLabel,
          time: new Date(latestWorkflowActivity.createdAt).toLocaleString(
            locale,
          ),
        })
      : null;

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
      toast.error(
        error instanceof Error
          ? error.message
          : tIssues("workflowFlow.toasts.requestReviewFailed"),
      );
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
    tIssues,
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
      toast.error(
        error instanceof Error
          ? error.message
          : tIssues("workflowFlow.toasts.requestHandoffFailed"),
      );
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
    tIssues,
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
      toast.error(
        error instanceof Error
          ? error.message
          : tIssues("workflowFlow.toasts.blockFailed"),
      );
    }
  }, [
    blockWorkflowRunMutation,
    collaborationNote,
    issue.id,
    issue.workspaceId,
    onUpdate,
    tIssues,
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
      toast.error(
        error instanceof Error
          ? error.message
          : tIssues("workflowFlow.toasts.unblockFailed"),
      );
    }
  }, [
    collaborationNote,
    issue.id,
    issue.workspaceId,
    onUpdate,
    tIssues,
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
      toast.error(
        error instanceof Error
          ? error.message
          : tIssues("workflowFlow.toasts.approveReviewFailed"),
      );
    }
  }, [
    collaborationNote,
    issue.id,
    issue.workspaceId,
    onUpdate,
    respondWorkflowReviewMutation,
    tIssues,
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
      toast.error(
        error instanceof Error
          ? error.message
          : tIssues("workflowFlow.toasts.requestChangesFailed"),
      );
    }
  }, [
    collaborationNote,
    issue.id,
    issue.workspaceId,
    onUpdate,
    respondWorkflowReviewMutation,
    tIssues,
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
      toast.error(
        error instanceof Error
          ? error.message
          : tIssues("workflowFlow.toasts.acceptHandoffFailed"),
      );
    }
  }, [
    acceptWorkflowHandoffMutation,
    collaborationNote,
    issue.id,
    issue.workspaceId,
    onUpdate,
    tIssues,
  ]);

  if (!workflowIssue || !workflow) {
    return (
      <Card className="border-app-border bg-app-content-bg shadow-none">
        <CardContent className="flex min-h-[240px] flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="text-app-text-muted">
            {tIssues("workflowFlow.states.loadFailed")}
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-app-border bg-transparent text-app-text-primary"
            onClick={onClose}
          >
            {tIssues("workflowDetail.back")}
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
    workflowRun?.currentAssigneeName ||
    currentNodeStatus?.assigneeName ||
    tIssues("workflowFlow.meta.unassigned");
  const pendingTargetLabel =
    workflowRun?.targetName || tIssues("workflowFlow.meta.specifiedMember");
  const hasSelectedTarget = Boolean(selectedCollaborationTarget?.userId);
  const hasEligibleCollaborationTargets = collaborationEligibleMembers.length > 0;
  const canRequestCollaboration =
    Boolean(workflowRun) &&
    workflowRun?.runStatus === "ACTIVE" &&
    isCurrentAssignee;
  const canEditNodeStatus = workflowRun
    ? workflowRun.runStatus === "ACTIVE" && isCurrentAssignee
    : isCurrentAssignee;
  const issueMetaItems = [
    [tIssues("workflowFlow.meta.number"), issue.key || `#${issue.id.slice(0, 8)}`],
    [tIssues("workflowFlow.meta.workflow"), workflowIssue.workflowName],
    [
      tIssues("workflowFlow.meta.status"),
      workflowRun
        ? runStatusLabels[workflowRun.runStatus]
        : tIssues("workflowFlow.meta.notStarted"),
    ],
    [
      tIssues("workflowFlow.meta.currentStep"),
      workflowRun?.currentStepName ||
        currentNode?.data?.label ||
        tIssues("workflowFlow.meta.unknownStep"),
    ],
    [tIssues("workflowFlow.meta.currentOwner"), currentOwnerLabel],
    [
      tIssues("workflowFlow.meta.priority"),
      issue.priority
        ? tIssues(`priority.${issue.priority.toLowerCase()}`)
        : tIssues("workflowFlow.meta.notSet"),
    ],
    [
      tIssues("workflowFlow.meta.stepCount"),
      tIssues("workflowFlow.meta.stepsValue", {
        count: workflowRun?.totalSteps || workflow.nodes.length,
      }),
    ],
  ] as const;
  const collaborationTags = workflowRun
    ? [
        [tIssues("workflowFlow.meta.action"), actionTypeLabels[workflowRun.currentActionType]],
        [
          tIssues("workflowFlow.meta.owner"),
          workflowRun.currentAssigneeName || tIssues("workflowFlow.meta.unassigned"),
        ],
        [
          tIssues("workflowFlow.meta.step"),
          workflowRun.currentStepName || tIssues("workflowFlow.meta.unknownStep"),
        ],
        [tIssues("workflowFlow.meta.version"), workflowRun.templateVersion || "v1"],
        ...(workflowRun.lastEventType === "workflow.review.approved" ||
        workflowRun.lastEventType === "workflow.review.changes_requested"
          ? [
              [
                tIssues("workflowFlow.meta.recentReview"),
                reviewOutcomeLabels[
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
                {tIssues("workflowFlow.header.workflow", {
                  name: workflowIssue.workflowName,
                })}
              </Badge>
              {workflowRun && (
                <Badge
                  variant="outline"
                  className="border-app-border text-app-text-primary"
                >
                  {runStatusLabels[workflowRun.runStatus]}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="border-app-border text-app-text-primary"
              >
                {tIssues("workflowFlow.header.priority", {
                  value: issue.priority
                    ? tIssues(`priority.${issue.priority.toLowerCase()}`)
                    : tIssues("workflowFlow.meta.notSet"),
                })}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-app-border bg-transparent text-app-text-primary"
              onClick={() => setIsAiThreadOpen(true)}
            >
              <RiSparklingLine className="h-4 w-4 text-sky-600" />
              {tIssues("workflowFlow.actions.openAi")}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-lg text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
              onClick={onClose}
            >
              <RiCloseLine className="h-5 w-5" />
            </Button>
          </div>
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
                {tIssues("workflowFlow.header.workflowTask")}
              </CardTitle>
              <TabsList
                variant="line"
                className="h-auto w-full gap-2 bg-transparent p-0 sm:w-auto"
              >
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-700"
                >
                  {tIssues("workflowFlow.tabs.overview")}
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
                      {tIssues("workflowFlow.overview.title")}
                    </div>
                    <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-app-text-secondary">
                      {issue.description?.trim() ||
                        tIssues("workflowFlow.overview.empty")}
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
                    {tIssues("workflowFlow.collaboration.title")}
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="border-app-border text-xs text-app-text-primary"
                >
                  {runStatusLabels[workflowRun.runStatus]}
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
                      {label}: {value}
                    </Badge>
                  ))}
                </div>

                {workflowRun.targetName && (
                  <div className="flex flex-wrap gap-2 rounded-lg border border-app-border bg-app-bg px-3 py-2 text-xs text-app-text-secondary">
                    <span>
                      {tIssues("workflowFlow.collaboration.pendingTarget", {
                        value: workflowRun.targetName,
                      })}
                    </span>
                  </div>
                )}

                {latestWorkflowContextNote && (
                  <div className="rounded-lg border border-app-border bg-app-bg px-3 py-2.5">
                    <div className="text-xs font-medium uppercase tracking-wide text-app-text-muted">
                      {tIssues("workflowFlow.collaboration.latestNoteTitle")}
                    </div>
                    {latestWorkflowContextMeta && (
                      <div className="mt-1 text-[11px] text-app-text-muted">
                        {latestWorkflowContextMeta}
                      </div>
                    )}
                    <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-app-text-primary">
                      {latestWorkflowContextNote}
                    </div>
                  </div>
                )}

                {workflowRun.runStatus === "ACTIVE" && (
                  <div className="space-y-2 rounded-lg border border-app-border bg-app-bg px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-app-text-primary">
                        {tIssues("workflowFlow.collaboration.activeTitle", {
                          name: currentOwnerLabel,
                        })}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-app-text-muted">
                        {tIssues("workflowFlow.collaboration.activeDescription")}
                      </p>
                    </div>

                    {canRequestCollaboration ? (
                      <>
                        {hasEligibleCollaborationTargets ? (
                          <div className="space-y-2">
                            <Label className="text-sm text-app-text-primary">
                              {tIssues("workflowFlow.collaboration.targetLabel")}
                            </Label>
                            <Select
                              value={collaborationTargetId || undefined}
                              onValueChange={setCollaborationTargetId}
                            >
                              <SelectTrigger className="border-app-border bg-app-content-bg text-app-text-primary">
                                <SelectValue
                                  placeholder={tIssues(
                                    "workflowFlow.collaboration.targetPlaceholder",
                                  )}
                                />
                              </SelectTrigger>
                              <SelectContent className="border-app-border bg-app-content-bg">
                                {collaborationEligibleMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-app-border px-3 py-2 text-sm text-app-text-secondary">
                            {tIssues("workflowFlow.collaboration.noEligibleTarget")}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-sm text-app-text-primary">
                            {tIssues("workflowFlow.collaboration.noteLabel")}
                          </Label>
                          <Textarea
                            value={collaborationNote}
                            onChange={(event) =>
                              setCollaborationNote(event.target.value)
                            }
                            rows={2}
                            placeholder={tIssues(
                              "workflowFlow.collaboration.notePlaceholder",
                            )}
                            className="border-app-border bg-app-content-bg text-app-text-primary"
                          />
                        </div>

                        {hasEligibleCollaborationTargets && !hasSelectedTarget && (
                          <p className="text-xs text-app-text-muted">
                            {tIssues("workflowFlow.collaboration.targetOptionalHint")}
                          </p>
                        )}

                        <div className="grid gap-2 sm:grid-cols-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="border-app-border bg-transparent text-app-text-primary"
                            disabled={
                              requestWorkflowReviewMutation.isPending ||
                              !hasSelectedTarget ||
                              !hasEligibleCollaborationTargets
                            }
                            onClick={handleRequestReview}
                          >
                            {tIssues("workflowFlow.actions.requestReview")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-app-border bg-transparent text-app-text-primary"
                            disabled={
                              requestWorkflowHandoffMutation.isPending ||
                              !hasSelectedTarget ||
                              !hasEligibleCollaborationTargets
                            }
                            onClick={handleRequestHandoff}
                          >
                            {tIssues("workflowFlow.actions.requestHandoff")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-rose-500/30 bg-transparent text-rose-600 hover:bg-rose-500/10 dark:text-rose-300"
                            disabled={blockWorkflowRunMutation.isPending}
                            onClick={handleBlockRun}
                          >
                            {tIssues("workflowFlow.actions.markBlocked")}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-lg border border-dashed border-app-border px-3 py-2 text-sm text-app-text-secondary">
                        {tIssues("workflowFlow.collaboration.onlyCurrentOwner")}
                      </div>
                    )}
                  </div>
                )}

                {workflowRun.runStatus === "WAITING_REVIEW" && (
                  <div className="space-y-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-app-text-primary">
                        {tIssues("workflowFlow.review.waitingTitle", {
                          name: pendingTargetLabel,
                        })}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-app-text-muted">
                        {tIssues("workflowFlow.review.waitingDescription")}
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
                          placeholder={tIssues("workflowFlow.review.placeholder")}
                          className="border-app-border bg-app-content-bg text-app-text-primary"
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            type="button"
                            className="bg-sky-600 text-white hover:bg-sky-500"
                            disabled={respondWorkflowReviewMutation.isPending}
                            onClick={handleApproveReview}
                          >
                            {tIssues("workflowFlow.actions.approveReview")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-app-border bg-transparent text-app-text-primary"
                            disabled={respondWorkflowReviewMutation.isPending}
                            onClick={handleRequestChanges}
                          >
                            {tIssues("workflowFlow.actions.requestChanges")}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-lg border border-dashed border-sky-500/20 px-3 py-2 text-sm text-app-text-secondary">
                        {tIssues("workflowFlow.review.readonlyHint", {
                          name: pendingTargetLabel,
                        })}
                      </div>
                    )}
                  </div>
                )}

                {workflowRun.runStatus === "HANDOFF_PENDING" && (
                  <div className="space-y-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-app-text-primary">
                        {tIssues("workflowFlow.handoff.waitingTitle", {
                          name: pendingTargetLabel,
                        })}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-app-text-muted">
                        {tIssues("workflowFlow.handoff.waitingDescription")}
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
                          placeholder={tIssues("workflowFlow.handoff.placeholder")}
                          className="border-app-border bg-app-content-bg text-app-text-primary"
                        />
                        <Button
                          type="button"
                          className="w-full bg-sky-600 text-white hover:bg-sky-500"
                          disabled={acceptWorkflowHandoffMutation.isPending}
                          onClick={handleAcceptHandoff}
                        >
                          {tIssues("workflowFlow.actions.acceptHandoff")}
                        </Button>
                      </>
                    ) : (
                      <div className="rounded-lg border border-dashed border-cyan-500/20 px-3 py-2 text-sm text-app-text-secondary">
                        {tIssues("workflowFlow.handoff.readonlyHint", {
                          name: pendingTargetLabel,
                        })}
                      </div>
                    )}
                  </div>
                )}

                {workflowRun.runStatus === "BLOCKED" && (
                  <div className="space-y-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-app-text-primary">
                        {tIssues("workflowFlow.blocked.title")}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-app-text-muted">
                        {tIssues("workflowFlow.blocked.description", {
                          name: currentOwnerLabel,
                        })}
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
                          placeholder={tIssues("workflowFlow.blocked.placeholder")}
                          className="border-app-border bg-app-content-bg text-app-text-primary"
                        />
                        <Button
                          type="button"
                          className="w-full bg-sky-600 text-white hover:bg-sky-500"
                          disabled={unblockWorkflowRunMutation.isPending}
                          onClick={handleUnblockRun}
                        >
                          {tIssues("workflowFlow.actions.unblock")}
                        </Button>
                      </>
                    ) : (
                      <div className="rounded-lg border border-dashed border-rose-500/20 px-3 py-2 text-sm text-app-text-secondary">
                        {tIssues("workflowFlow.blocked.readonlyHint")}
                      </div>
                    )}
                  </div>
                )}

                {workflowRun.runStatus === "DONE" && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-app-text-secondary">
                    {tIssues("workflowFlow.done.description")}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {currentNode && canEditNodeStatus && (
            <NodeStatusUpdate
              nodeId={currentNode.id}
              currentStatus={currentNodeStatus?.status || "TODO"}
              assignee={currentNodeStatus?.assigneeName}
              canEdit={canEditNodeStatus}
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
                {currentNodeFocusUsers
                  .map((participant) => participant.name)
                  .join(", ")}{" "}
                {tIssues("workflowFlow.focusingNode")}
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
                  {tIssues("workflowFlow.records.title")}
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
                  {tIssues("workflowFlow.records.history")}
                </TabsTrigger>
                <TabsTrigger
                  value="discussion"
                  className="data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-700"
                >
                  <RiFileTextLine className="h-4 w-4" />
                  {tIssues("workflowFlow.records.discussion")}
                </TabsTrigger>
                <TabsTrigger
                  value="records"
                  className="data-[state=active]:bg-sky-500/10 data-[state=active]:text-sky-700"
                >
                  <RiFileTextLine className="h-4 w-4" />
                  {tIssues("workflowFlow.records.outputs", {
                    count: stepRecords.length,
                  })}
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

      <AiThreadShell
        open={isAiThreadOpen}
        onOpenChange={setIsAiThreadOpen}
        workspaceId={issue.workspaceId}
        originSurfaceType="ISSUE"
        originSurfaceId={issue.id}
        originTitle={issue.title}
      />
    </div>
  );
}
