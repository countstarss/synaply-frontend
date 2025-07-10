"use client";

import React, { useState, useMemo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { RiCloseLine, RiHistoryLine, RiFileTextLine } from "react-icons/ri";
import CustomNode from "../workflow/CustomNode";
import { Issue } from "@/lib/fetchers/issue";
import { WorkflowIssue } from "@/types/team";
import { useAuth } from "@/context/AuthContext";
import { useCurrentTeam, useTeamMembers } from "@/hooks/useTeam";
import { useIssueStepRecords, useIssueActivities } from "@/hooks/useIssueApi";
import { NodeStatusUpdate } from "./NodeStatusUpdate";
import { RecordModal } from "./RecordModal";
import { useWorkflowNodeStatus } from "../hooks/useWorkflowNodeStatus";
import {
  createInitialWorkflowIssue,
  parseWorkflowSnapshot,
  createFlowNodesAndEdges,
} from "../utils/workflowUtils";
import { HistoryTab, DiscussionTab, RecordsTab } from "./tabs";

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

  // 获取团队成员
  const { data: teamMembers = [] } = useTeamMembers(team?.id);
  const { user, session } = useAuth();

  // MARK: 解析工作流快照
  const initialWorkflowIssue = React.useMemo(
    () => createInitialWorkflowIssue(issue),
    [issue]
  );

  const workflow = React.useMemo(
    () => parseWorkflowSnapshot(issue.workflowSnapshot),
    [issue.workflowSnapshot]
  );

  const [workflowIssue, setWorkflowIssue] = useState<WorkflowIssue | null>(
    initialWorkflowIssue
  );

  // MARK: Tabs
  const [activeTab, setActiveTab] = useState<
    "history" | "discussion" | "records"
  >("history");

  // MARK: TabContent
  // Records data
  const { data: stepRecords = [] } = useIssueStepRecords(
    issue.workspaceId,
    issue.id
  );

  // Activities data
  const { data: activities = [] } = useIssueActivities(
    issue.workspaceId,
    issue.id
  );

  // MARK: 节点和边计算
  // 使用工具函数转换为ReactFlow的nodes和edges
  const { nodes, edges } = useMemo(
    () => createFlowNodesAndEdges(workflow, workflowIssue),
    [workflow, workflowIssue]
  );

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

  // 使用自定义hook替代原来的状态管理逻辑
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
              nodesConnectable={true} // 禁止创建新连接
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
        <div className="flex flex-col h-[calc(100vh-170px)] gap-2 flex-1">
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
          <div className="flex-1 h-[calc(100vh-520px)] bg-app-content-bg rounded-lg border border-app-border flex flex-col">
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
                  讨论
                </button>
                <button
                  onClick={() => setActiveTab("records")}
                  className={`flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors ${
                    activeTab === "records"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-app-text-secondary hover:text-app-text-primary hover:bg-app-button-hover"
                  }`}
                >
                  <RiFileTextLine className="w-4 h-4" />
                  成果 ({stepRecords.length})
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "history" ? (
                <HistoryTab activities={activities} />
              ) : activeTab === "discussion" ? (
                <DiscussionTab
                  issueId={issue.id}
                  workspaceId={issue.workspaceId}
                  teamMembers={teamMembers}
                />
              ) : (
                <RecordsTab records={stepRecords} />
              )}
            </div>
          </div>
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
