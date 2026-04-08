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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useIssueActivities, useIssueStepRecords } from "@/hooks/useIssueApi";
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

const nodeTypes = {
  custom: CustomNode,
};

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
  const [activeTab, setActiveTab] = useState<"history" | "discussion" | "records">(
    "history",
  );

  const { data: stepRecords = [] } = useIssueStepRecords(
    issue.workspaceId,
    issue.id,
  );
  const { data: activities = [] } = useIssueActivities(
    issue.workspaceId,
    issue.id,
  );

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
        name:
          member.user?.name?.trim() ||
          member.user?.email?.split("@")[0] ||
          `成员 ${member.id.slice(0, 6)}`,
        email: member.user?.email,
        avatarUrl: member.user?.avatar_url || member.user?.avatarUrl,
      })),
    [teamMembers],
  );

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

  React.useEffect(() => {
    setFocusingNode(currentNode?.id || null);
  }, [currentNode?.id, setFocusingNode]);

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

  const isCurrentAssignee = currentNodeStatus?.assigneeId === user?.id;
  const currentNodeFocusUsers = currentNode
    ? getFocusedUsersForNode(currentNode.id)
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

      <div className="flex min-h-0 flex-1 flex-row gap-2">
        <Card className="flex flex-[2] flex-col border-app-border bg-app-content-bg shadow-none">
          <CardHeader className="border-b border-app-border p-4">
            <CardTitle className="text-lg text-app-text-primary">
              工作流进度
            </CardTitle>
          </CardHeader>

          <CardContent className="min-h-0 flex-1 p-0">
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
          </CardContent>
        </Card>

        <div className="flex h-[calc(100vh-170px)] flex-1 flex-col gap-2">
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

          {currentNodeFocusUsers.length > 0 && (
            <Card className="border-app-border bg-app-content-bg shadow-none">
              <CardContent className="p-3 text-xs text-app-text-muted">
                {currentNodeFocusUsers.map((participant) => participant.name).join("、")}
                正在关注当前节点
              </CardContent>
            </Card>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "history" | "discussion" | "records")
            }
            className="min-h-0 flex-1"
          >
            <Card className="flex min-h-0 flex-1 flex-col border-app-border bg-app-content-bg shadow-none">
              <CardHeader className="border-b border-app-border p-4">
                <TabsList variant="line" className="h-auto gap-2 bg-transparent p-0">
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
      </div>

      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSubmit={handleSubmitRecord}
      />
    </div>
  );
}
