"use client";

import { useCallback, useMemo, useState } from "react";
import { Edge, Node } from "reactflow";
import { toast } from "sonner";
import {
  useAdvanceWorkflowRun,
  useRevertWorkflowRun,
  useUpdateWorkflowRunStatus,
} from "@/hooks/useIssueApi";
import { Issue } from "@/lib/fetchers/issue";
import { WorkflowIssue } from "@/types/team";
import { createInitialWorkflowIssue } from "@/app/[locale]/(main)/workflows/_components/utils/workflowUtils";
import { Session } from "@supabase/supabase-js";
import { IssueStatus } from "@/types/prisma";

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
  onUpdate,
}: UseWorkflowNodeStatusProps) => {
  const updateWorkflowRunStatusMutation = useUpdateWorkflowRunStatus();
  const advanceWorkflowRunMutation = useAdvanceWorkflowRun();
  const revertWorkflowRunMutation = useRevertWorkflowRun();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [pendingNextEdge, setPendingNextEdge] = useState<Edge | null>(null);

  const syncWorkflowIssue = useCallback(
    (nextIssue: Issue) => {
      const nextWorkflowIssue = createInitialWorkflowIssue(nextIssue);
      setWorkflowIssue(nextWorkflowIssue);
      onUpdate();
    },
    [onUpdate, setWorkflowIssue],
  );

  const ensureCurrentUserCanAct = useCallback(() => {
    if (!workflowIssue || !currentNode) {
      return false;
    }

    const nodeStatus = workflowIssue.nodeStatuses[currentNode.id] as
      | {
          assigneeId?: string;
        }
      | undefined;

    if (nodeStatus?.assigneeId && nodeStatus.assigneeId !== user?.id) {
      toast.error("只有当前节点负责人才能执行此操作");
      return false;
    }

    return true;
  }, [currentNode, user?.id, workflowIssue]);

  const handleStatusUpdate = useCallback(
    async (nodeId: string, status: string, comment?: string) => {
      if (!workflowIssue || !currentNode) {
        return;
      }

      if (!ensureCurrentUserCanAct()) {
        return;
      }

      try {
        const updatedIssue = await updateWorkflowRunStatusMutation.mutateAsync({
          workspaceId: issue.workspaceId,
          issueId: issue.id,
          data: {
            status: status as IssueStatus,
            comment,
          },
        });

        syncWorkflowIssue(updatedIssue);
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "节点状态同步失败");
      }
    },
    [
      currentNode,
      ensureCurrentUserCanAct,
      issue.id,
      issue.workspaceId,
      syncWorkflowIssue,
      updateWorkflowRunStatusMutation,
      workflowIssue,
    ],
  );

  const handleNext = useCallback(() => {
    if (!workflow || !workflowIssue || !currentNode) {
      return;
    }

    if (!ensureCurrentUserCanAct()) {
      return;
    }

    const nextEdge = workflow.edges.find((edge: Edge) => edge.source === currentNode.id);
    if (!nextEdge) {
      return;
    }

    setPendingNextEdge(nextEdge);
    setIsRecordModalOpen(true);
  }, [currentNode, ensureCurrentUserCanAct, workflow, workflowIssue]);

  const handleSubmitRecord = useCallback(
    async ({ resultText }: { resultText: string }) => {
      if (!pendingNextEdge || !currentNode) {
        return;
      }

      try {
        const updatedIssue = await advanceWorkflowRunMutation.mutateAsync({
          workspaceId: issue.workspaceId,
          issueId: issue.id,
          data: {
            resultText,
          },
        });

        setPendingNextEdge(null);
        setIsRecordModalOpen(false);
        syncWorkflowIssue(updatedIssue);
      } catch (error) {
        console.error("推进 workflow run 失败", error);
        toast.error(error instanceof Error ? error.message : "推进 workflow run 失败");
      }
    },
    [
      advanceWorkflowRunMutation,
      currentNode,
      issue.id,
      issue.workspaceId,
      pendingNextEdge,
      syncWorkflowIssue,
    ],
  );

  const handlePrevious = useCallback(async () => {
    if (!workflow || !workflowIssue || !currentNode) {
      return;
    }

    if (!ensureCurrentUserCanAct()) {
      return;
    }

    try {
      const updatedIssue = await revertWorkflowRunMutation.mutateAsync({
        workspaceId: issue.workspaceId,
        issueId: issue.id,
        data: {},
      });

      syncWorkflowIssue(updatedIssue);
    } catch (error) {
      console.error("回退 workflow run 失败", error);
      toast.error(error instanceof Error ? error.message : "回退 workflow run 失败");
    }
  }, [
    currentNode,
    ensureCurrentUserCanAct,
    issue.id,
    issue.workspaceId,
    revertWorkflowRunMutation,
    syncWorkflowIssue,
    workflow,
    workflowIssue,
  ]);

  const canNext = useMemo(() => {
    if (!workflow || !currentNode) {
      return false;
    }

    return workflow.edges.some((edge: Edge) => edge.source === currentNode.id);
  }, [currentNode, workflow]);

  const canPrevious = useMemo(() => {
    if (!workflow || !currentNode) {
      return false;
    }

    return workflow.edges.some((edge: Edge) => edge.target === currentNode.id);
  }, [currentNode, workflow]);

  return {
    handleStatusUpdate,
    handleNext,
    handlePrevious,
    handleSubmitRecord,
    isRecordModalOpen,
    setIsRecordModalOpen,
    canNext,
    canPrevious,
    isBusy:
      updateWorkflowRunStatusMutation.isPending ||
      advanceWorkflowRunMutation.isPending ||
      revertWorkflowRunMutation.isPending,
  };
};

export default useWorkflowNodeStatus;
