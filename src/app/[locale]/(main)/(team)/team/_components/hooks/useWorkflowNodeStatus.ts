"use client";

import { useState, useCallback, useMemo } from "react";
import { Node, Edge } from "reactflow";
import { toast } from "sonner";
import {
  useUpdateIssue,
  useCreateIssueActivity,
  useCreateIssueStepRecord,
} from "@/hooks/useIssueApi";
import {
  CreateIssueStepRecordDto,
  CreateIssueActivityDto,
  Issue,
} from "@/lib/fetchers/issue";
import { WorkflowIssue } from "@/types/team";
import { IssueStatus } from "@/types/prisma";
import { workflowIssueStorage } from "@/app/[locale]/(main)/(team)/team/_utils/storage";
import { Session } from "@supabase/supabase-js";

interface WorkflowData {
  nodes: Node[];
  edges: Edge[];
  [key: string]: unknown;
}

interface UseWorkflowNodeStatusProps {
  issue: Issue;
  workflow: WorkflowData | null;
  workflowIssue: WorkflowIssue | null;
  setWorkflowIssue: React.Dispatch<React.SetStateAction<WorkflowIssue | null>>;
  currentNode: Node | null;
  user: {
    id?: string;
    user_metadata: {
      name?: string;
      avatar_url?: string;
    };
  } | null;
  session: Session | null;
  onUpdate: () => void;
}

export const useWorkflowNodeStatus = ({
  issue,
  workflow,
  workflowIssue,
  setWorkflowIssue,
  currentNode,
  user,
  session,
  onUpdate,
}: UseWorkflowNodeStatusProps) => {
  const updateIssueMutation = useUpdateIssue();
  const createActivityMutation = useCreateIssueActivity();
  const createStepRecordMutation = useCreateIssueStepRecord();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [pendingNextEdge, setPendingNextEdge] = useState<Edge | null>(null);

  // MARK: 更新节点状态
  const handleStatusUpdate = useCallback(
    async (nodeId: string, status: string, comment?: string) => {
      if (!workflowIssue) return;

      // NOTE: 权限校验
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodeStatus = workflowIssue.nodeStatuses[nodeId] as any;
      if (nodeStatus?.assigneeId && nodeStatus.assigneeId !== user?.id) {
        alert("只有当前节点负责人才能更新状态");
        return;
      }

      const prevIssue = { ...workflowIssue } as WorkflowIssue;

      // NOTE: 构造乐观更新数据
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

      const currentIndex = workflow?.nodes.findIndex(
        (n: Node) => n.id === optimisticIssue.currentNodeId
      );

      try {
        // NOTE: 更新Issue状态
        await updateIssueMutation.mutateAsync({
          workspaceId: issue.workspaceId,
          issueId: issue.id,
          data: {
            currentStepId: optimisticIssue.currentNodeId,
            currentStepIndex: currentIndex,
            currentStepStatus: status as IssueStatus,
          },
        });

        // NOTE: 创建活动记录
        const nodeName =
          (currentNode?.data as { label?: string })?.label || "步骤";
        const statusMap: Record<string, string> = {
          TODO: "待处理",
          IN_PROGRESS: "进行中",
          AMOST_DONE: "接近完成",
          DONE: "已完成",
        };

        await createActivityMutation.mutateAsync({
          workspaceId: issue.workspaceId,
          issueId: issue.id,
          data: {
            action: `将节点 "${nodeName}" 状态更新为 ${
              statusMap[status] || status
            }`,
            metadata: {
              nodeId,
              nodeName,
              oldStatus: nodeStatus?.status,
              newStatus: status,
              comment: comment || null,
            },
          } as CreateIssueActivityDto,
        });

        onUpdate();
      } catch (error) {
        console.error(error);
        // 回滚
        setWorkflowIssue(prevIssue);
        toast.error("节点状态同步失败");
      }
    },
    [
      workflowIssue,
      issue,
      onUpdate,
      workflow,
      updateIssueMutation,
      user?.id,
      currentNode,
      createActivityMutation,
      setWorkflowIssue,
    ]
  );

  // MARK: 执行下一步
  const proceedNext = useCallback(
    async (nextEdge: Edge) => {
      if (!workflow || !workflowIssue || !currentNode) return;

      // 权限校验
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currStatus = workflowIssue.nodeStatuses[currentNode.id] as any;
      if (currStatus?.assigneeId && currStatus.assigneeId !== user?.id) {
        alert("只有当前节点负责人才能执行此操作");
        return;
      }

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

      // NOTE: 同步后端
      try {
        if (session?.access_token) {
          const nextIndex = workflow.nodes.findIndex(
            (n: Node) => n.id === nextEdge.target
          );

          await updateIssueMutation.mutateAsync({
            workspaceId: issue.workspaceId,
            issueId: issue.id,
            data: {
              currentStepId: nextEdge.target,
              currentStepIndex: nextIndex,
              currentStepStatus: "TODO" as IssueStatus,
            },
          });

          // NOTE: 创建活动记录
          const currentNodeName =
            (currentNode.data as { label?: string })?.label || "步骤";
          const nextNode = workflow.nodes.find(
            (n: Node) => n.id === nextEdge.target
          );
          const nextNodeName =
            (nextNode?.data as { label?: string })?.label || "步骤";

          await createActivityMutation.mutateAsync({
            workspaceId: issue.workspaceId,
            issueId: issue.id,
            data: {
              action: `从 "${currentNodeName}" 前进到 "${nextNodeName}"`,
              metadata: {
                fromNodeId: currentNode.id,
                fromNodeName: currentNodeName,
                toNodeId: nextEdge.target,
                toNodeName: nextNodeName,
              },
            } as CreateIssueActivityDto,
          });
        }
      } catch (err) {
        console.error("同步后端失败", err);
      }

      onUpdate();
    },
    [
      workflow,
      workflowIssue,
      currentNode,
      user,
      setWorkflowIssue,
      session?.access_token,
      issue.workspaceId,
      issue.id,
      updateIssueMutation,
      createActivityMutation,
      onUpdate,
    ]
  );

  // MARK: 准备下一步
  const handleNext = useCallback(() => {
    if (!workflow || !workflowIssue || !currentNode) return;

    // 权限校验
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

    // 弹出成果物 Modal
    setPendingNextEdge(nextEdge);
    setIsRecordModalOpen(true);
  }, [workflow, workflowIssue, currentNode, user?.id]);

  // MARK: 提交成果物
  const handleSubmitRecord = useCallback(
    async ({ resultText }: { resultText: string }) => {
      if (!pendingNextEdge || !currentNode) return;

      try {
        await createStepRecordMutation.mutateAsync({
          workspaceId: issue.workspaceId,
          issueId: issue.id,
          data: {
            stepId: currentNode.id,
            stepName: (currentNode.data as { label?: string }).label || "步骤",
            index: 1,
            resultText,
            assigneeId: user?.id || "",
          } as CreateIssueStepRecordDto,
        });
        setIsRecordModalOpen(false);
        await proceedNext(pendingNextEdge);
      } catch (error) {
        console.error("创建成果物失败", error);
        toast.error("创建成果物失败");
      }
    },
    [
      pendingNextEdge,
      currentNode,
      createStepRecordMutation,
      issue.workspaceId,
      issue.id,
      user?.id,
      proceedNext,
    ]
  );

  // MARK: 上一步
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

    // NOTE:同步后端
    try {
      if (session?.access_token) {
        const prevIndex = workflow.nodes.findIndex(
          (n: Node) => n.id === prevEdge.source
        );

        await updateIssueMutation.mutateAsync({
          workspaceId: issue.workspaceId,
          issueId: issue.id,
          data: {
            currentStepId: prevEdge.source,
            currentStepIndex: prevIndex,
            currentStepStatus: "TODO" as IssueStatus,
          },
        });

        // NOTE:创建活动记录
        const currentNodeName =
          (currentNode.data as { label?: string })?.label || "步骤";
        const prevNode = workflow.nodes.find(
          (n: Node) => n.id === prevEdge.source
        );
        const prevNodeName =
          (prevNode?.data as { label?: string })?.label || "步骤";

        await createActivityMutation.mutateAsync({
          workspaceId: issue.workspaceId,
          issueId: issue.id,
          data: {
            action: `从 "${currentNodeName}" 回退到 "${prevNodeName}"`,
            metadata: {
              fromNodeId: currentNode.id,
              fromNodeName: currentNodeName,
              toNodeId: prevEdge.source,
              toNodeName: prevNodeName,
            },
          } as CreateIssueActivityDto,
        });
      }
    } catch (err) {
      console.error("同步后端失败", err);
    }

    onUpdate();
  }, [
    workflow,
    workflowIssue,
    currentNode,
    user,
    setWorkflowIssue,
    session?.access_token,
    issue.workspaceId,
    issue.id,
    updateIssueMutation,
    createActivityMutation,
    onUpdate,
  ]);

  // MARK: 是否可以下一步
  const canNext = useMemo(() => {
    if (!workflow || !currentNode) return false;
    return workflow.edges.some((e: Edge) => e.source === currentNode.id);
  }, [workflow, currentNode]);

  // MARK: 是否可以上一步
  const canPrevious = useMemo(() => {
    if (!workflow || !currentNode) return false;
    return workflow.edges.some((e: Edge) => e.target === currentNode.id);
  }, [workflow, currentNode]);

  return {
    handleStatusUpdate,
    handleNext,
    handlePrevious,
    handleSubmitRecord,
    isRecordModalOpen,
    setIsRecordModalOpen,
    canNext,
    canPrevious,
  };
};

export default useWorkflowNodeStatus;
