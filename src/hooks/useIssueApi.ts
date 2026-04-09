import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  AdvanceWorkflowRunDto,
  advanceWorkflowRun,
  acceptWorkflowHandoff,
  AcceptWorkflowHandoffDto,
  BlockWorkflowRunDto,
  blockWorkflowRun,
  CreateIssueDto,
  CreateWorkflowIssueDto,
  createIssue,
  createWorkflowIssue,
  CreateIssueStepRecordDto,
  CreateIssueActivityDto,
  deleteIssue,
  getIssue,
  getIssueActivities,
  getIssueStepRecords,
  getIssues,
  getWorkflowRun,
  Issue,
  IssueQueryParams,
  isWorkflowIssue,
  RespondWorkflowReviewDto,
  RequestWorkflowHandoffDto,
  requestWorkflowHandoff,
  RequestWorkflowReviewDto,
  requestWorkflowReview,
  respondWorkflowReview,
  RevertWorkflowRunDto,
  revertWorkflowRun,
  SubmitWorkflowRecordDto,
  submitWorkflowRecord,
  unblockWorkflowRun,
  UnblockWorkflowRunDto,
  updateIssue,
  updateWorkflowRunStatus,
  UpdateWorkflowRunStatusDto,
  createIssueActivity,
  createIssueStepRecord,
} from "@/lib/fetchers/issue";
import {
  broadcastIssueCreated,
  broadcastIssueDeleted,
  broadcastIssueActivityCreated,
  broadcastIssueStepRecordCreated,
  broadcastIssueUpdated,
  broadcastWorkflowRunEvent,
} from "@/lib/realtime/broadcast";
import { IssueType } from "@/types/prisma";

/**
 * MARK: 获取工作空间Issue
 */
export const useIssues = (
  workspaceId: string,
  params: IssueQueryParams = {},
  options: { enabled?: boolean } = {},
) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["issues", workspaceId, params],
    queryFn: async () => {
      if (!session?.access_token) return [];
      return getIssues(workspaceId, session.access_token, params);
    },
    enabled:
      (options.enabled ?? true) && !!session?.access_token && !!workspaceId,
  });
};

export const useIssue = (
  workspaceId: string,
  issueId: string,
  options: { enabled?: boolean } = {},
) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["issue", workspaceId, issueId],
    queryFn: async () => {
      if (!session?.access_token) {
        return null;
      }

      return getIssue(workspaceId, issueId, session.access_token);
    },
    enabled:
      (options.enabled ?? true) &&
      !!session?.access_token &&
      !!workspaceId &&
      !!issueId,
  });
};

export const useWorkflowRun = (
  workspaceId: string,
  issueId: string,
  options: { enabled?: boolean } = {},
) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["workflow-run", workspaceId, issueId],
    queryFn: async () => {
      if (!session?.access_token) {
        return null;
      }

      return getWorkflowRun(workspaceId, issueId, session.access_token);
    },
    enabled:
      (options.enabled ?? true) &&
      !!session?.access_token &&
      !!workspaceId &&
      !!issueId,
  });
};

/**
 * MARK: 创建普通Issue
 */
export const useCreateIssue = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issue,
    }: {
      workspaceId: string;
      issue: Partial<CreateIssueDto>;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      const issueData: CreateIssueDto = {
        title: issue.title || "",
        description: issue.description,
        workspaceId,
        stateId: issue.stateId,
        projectId: issue.projectId,
        directAssigneeId: issue.directAssigneeId,
        priority: issue.priority,
        visibility: issue.visibility,
        dueDate: issue.dueDate,
        assigneeIds: issue.assigneeIds,
        labelIds: issue.labelIds,
      };

      return createIssue(issueData, session.access_token);
    },
    onSuccess: async (createdIssue, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-summary", variables.workspaceId],
      });

      if (!session?.access_token || !createdIssue?.id) {
        return;
      }

      await broadcastIssueCreated(
        {
          issueId: createdIssue.id,
          workspaceId: variables.workspaceId,
          issueType: createdIssue.issueType ?? null,
        },
        session.access_token,
      );
    },
  });
};

/**
 * MARK: 基于工作流创建
 */
export const useCreateWorkflowIssue = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issue,
      workflowId,
    }: {
      workspaceId: string;
      issue: Partial<CreateIssueDto>;
      workflowId: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      const issueData: CreateWorkflowIssueDto = {
        title: issue.title || "",
        description: issue.description,
        workspaceId,
        dueDate: issue.dueDate,
        projectId: issue.projectId,
        directAssigneeId: issue.directAssigneeId,
        stateId: issue.stateId,
        priority: issue.priority,
        visibility: issue.visibility,
        assigneeIds: issue.assigneeIds,
        labelIds: issue.labelIds,
        workflowId,
      };

      const createdIssue = await createWorkflowIssue(
        issueData,
        session.access_token
      );

      return isWorkflowIssue(createdIssue)
        ? createdIssue
        : { ...createdIssue, issueType: IssueType.WORKFLOW };
    },
    onSuccess: async (createdIssue, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-summary", variables.workspaceId],
      });

      if (!session?.access_token || !createdIssue?.id) {
        return;
      }

      await broadcastIssueCreated(
        {
          issueId: createdIssue.id,
          workspaceId: variables.workspaceId,
          issueType: createdIssue.issueType ?? null,
        },
        session.access_token,
      );
    },
  });
};

function invalidateWorkflowRunQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  workspaceId: string,
  issueId: string
) {
  queryClient.invalidateQueries({
    queryKey: ["issue", workspaceId, issueId],
  });
  queryClient.invalidateQueries({
    queryKey: ["workflow-run", workspaceId, issueId],
  });
  queryClient.invalidateQueries({
    queryKey: ["issues", workspaceId],
  });
  queryClient.invalidateQueries({
    queryKey: ["my-work", workspaceId],
  });
  queryClient.invalidateQueries({
    queryKey: ["inbox", workspaceId],
  });
  queryClient.invalidateQueries({
    queryKey: ["inbox-summary", workspaceId],
  });
  queryClient.invalidateQueries({
    queryKey: ["issue-step-records", issueId],
  });
  queryClient.invalidateQueries({
    queryKey: ["issue-activities", issueId],
  });
  queryClient.invalidateQueries({
    queryKey: ["project-summary", workspaceId],
  });
}

async function emitWorkflowRunEvent(
  accessToken: string,
  payload: {
    issueId: string;
    workspaceId: string;
    event: string;
    runStatus: string | null;
    currentStepId: string | null;
    targetStepId?: string | null;
  }
) {
  await broadcastWorkflowRunEvent(payload, accessToken);
}

export const useUpdateWorkflowRunStatus = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: UpdateWorkflowRunStatusDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return updateWorkflowRunStatus(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: async (updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );

      if (!session?.access_token) {
        return;
      }

      await emitWorkflowRunEvent(session.access_token, {
        issueId: variables.issueId,
        workspaceId: variables.workspaceId,
        event: "workflow.step.status_changed",
        runStatus: updatedIssue.workflowRun?.runStatus ?? null,
        currentStepId: updatedIssue.currentStepId ?? null,
      });
    },
  });
};

export const useAdvanceWorkflowRun = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: AdvanceWorkflowRunDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return advanceWorkflowRun(workspaceId, issueId, data, session.access_token);
    },
    onSuccess: async (updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );

      if (!session?.access_token) {
        return;
      }

      await emitWorkflowRunEvent(session.access_token, {
        issueId: variables.issueId,
        workspaceId: variables.workspaceId,
        event:
          updatedIssue.workflowRun?.runStatus === "DONE"
            ? "workflow.run.completed"
            : "workflow.step.completed",
        runStatus: updatedIssue.workflowRun?.runStatus ?? null,
        currentStepId: updatedIssue.currentStepId ?? null,
      });
    },
  });
};

export const useRevertWorkflowRun = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: RevertWorkflowRunDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return revertWorkflowRun(workspaceId, issueId, data, session.access_token);
    },
    onSuccess: async (updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );

      if (!session?.access_token) {
        return;
      }

      await emitWorkflowRunEvent(session.access_token, {
        issueId: variables.issueId,
        workspaceId: variables.workspaceId,
        event: "workflow.step.reverted",
        runStatus: updatedIssue.workflowRun?.runStatus ?? null,
        currentStepId: updatedIssue.currentStepId ?? null,
      });
    },
  });
};

export const useBlockWorkflowRun = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: BlockWorkflowRunDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return blockWorkflowRun(workspaceId, issueId, data, session.access_token);
    },
    onSuccess: async (updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );

      if (!session?.access_token) {
        return;
      }

      await emitWorkflowRunEvent(session.access_token, {
        issueId: variables.issueId,
        workspaceId: variables.workspaceId,
        event: "workflow.blocked",
        runStatus: updatedIssue.workflowRun?.runStatus ?? null,
        currentStepId: updatedIssue.currentStepId ?? null,
      });
    },
  });
};

export const useUnblockWorkflowRun = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: UnblockWorkflowRunDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return unblockWorkflowRun(workspaceId, issueId, data, session.access_token);
    },
    onSuccess: async (updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );

      if (!session?.access_token) {
        return;
      }

      await emitWorkflowRunEvent(session.access_token, {
        issueId: variables.issueId,
        workspaceId: variables.workspaceId,
        event: "workflow.unblocked",
        runStatus: updatedIssue.workflowRun?.runStatus ?? null,
        currentStepId: updatedIssue.currentStepId ?? null,
      });
    },
  });
};

export const useRequestWorkflowReview = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: RequestWorkflowReviewDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return requestWorkflowReview(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: async (updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );

      if (!session?.access_token) {
        return;
      }

      await emitWorkflowRunEvent(session.access_token, {
        issueId: variables.issueId,
        workspaceId: variables.workspaceId,
        event: "workflow.review.requested",
        runStatus: updatedIssue.workflowRun?.runStatus ?? null,
        currentStepId: updatedIssue.currentStepId ?? null,
      });
    },
  });
};

export const useRequestWorkflowHandoff = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: RequestWorkflowHandoffDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return requestWorkflowHandoff(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: async (updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );

      if (!session?.access_token) {
        return;
      }

      await emitWorkflowRunEvent(session.access_token, {
        issueId: variables.issueId,
        workspaceId: variables.workspaceId,
        event: "workflow.handoff.requested",
        runStatus: updatedIssue.workflowRun?.runStatus ?? null,
        currentStepId: updatedIssue.currentStepId ?? null,
      });
    },
  });
};

export const useRespondWorkflowReview = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: RespondWorkflowReviewDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return respondWorkflowReview(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: async (updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );

      if (!session?.access_token) {
        return;
      }

      await emitWorkflowRunEvent(session.access_token, {
        issueId: variables.issueId,
        workspaceId: variables.workspaceId,
        event:
          variables.data.outcome === "APPROVED"
            ? "workflow.review.approved"
            : "workflow.review.changes_requested",
        runStatus: updatedIssue.workflowRun?.runStatus ?? null,
        currentStepId: updatedIssue.currentStepId ?? null,
      });
    },
  });
};

export const useAcceptWorkflowHandoff = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: AcceptWorkflowHandoffDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return acceptWorkflowHandoff(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: async (updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );

      if (!session?.access_token) {
        return;
      }

      await emitWorkflowRunEvent(session.access_token, {
        issueId: variables.issueId,
        workspaceId: variables.workspaceId,
        event: "workflow.handoff.accepted",
        runStatus: updatedIssue.workflowRun?.runStatus ?? null,
        currentStepId: updatedIssue.currentStepId ?? null,
      });
    },
  });
};

export const useSubmitWorkflowRecord = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: SubmitWorkflowRecordDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return submitWorkflowRecord(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: async (updatedIssue, variables) => {
      invalidateWorkflowRunQueries(
        queryClient,
        variables.workspaceId,
        variables.issueId
      );

      if (!session?.access_token) {
        return;
      }

      await emitWorkflowRunEvent(session.access_token, {
        issueId: variables.issueId,
        workspaceId: variables.workspaceId,
        event: "workflow.record.submitted",
        runStatus: updatedIssue.workflowRun?.runStatus ?? null,
        currentStepId: updatedIssue.currentStepId ?? null,
      });
    },
  });
};

/**
 * MARK: 更新 Issue （PATCH）
 */
export const useUpdateIssue = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: Partial<Issue>;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return updateIssue(workspaceId, issueId, data, session.access_token);
    },
    onSuccess: async (updatedIssue, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-summary", variables.workspaceId],
      });

      if (!session?.access_token) {
        return;
      }

      await broadcastIssueUpdated(
        {
          issueId: variables.issueId,
          workspaceId: variables.workspaceId,
          changedFields: Object.keys(variables.data),
          issueType: updatedIssue.issueType ?? null,
        },
        session.access_token,
      );
    },
  });
};

/**
 * MARK: 删除 Issue
 */
export const useDeleteIssue = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
    }: {
      workspaceId: string;
      issueId: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }
      await deleteIssue(workspaceId, issueId, session.access_token);
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-work", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["inbox-summary", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-summary", variables.workspaceId],
      });

      if (!session?.access_token) {
        return;
      }

      await broadcastIssueDeleted(
        {
          issueId: variables.issueId,
          workspaceId: variables.workspaceId,
        },
        session.access_token,
      );
    },
  });
};

/**
 * MARK: 步骤记录列表
 */
export const useIssueStepRecords = (workspaceId: string, issueId: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["issue-step-records", issueId],
    queryFn: () =>
      getIssueStepRecords(workspaceId, issueId, session!.access_token),
    enabled: !!session?.access_token && !!issueId,
  });
};

export const useCreateIssueStepRecord = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: CreateIssueStepRecordDto;
    }) => {
      if (!session?.access_token) throw new Error("未授权");
      return createIssueStepRecord(
        workspaceId,
        issueId,
        data,
        session.access_token,
      );
    },
    onSuccess: async (createdStepRecord, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issue-step-records", variables.issueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project-summary", variables.workspaceId],
      });

      if (!session?.access_token) {
        return;
      }

      await broadcastIssueStepRecordCreated(
        {
          issueId: variables.issueId,
          workspaceId: variables.workspaceId,
          stepRecordId: createdStepRecord.id,
          stepId: createdStepRecord.stepId,
          assigneeId: createdStepRecord.assigneeId,
        },
        session.access_token,
      );
    },
  });
};

/**
 * MARK: Issue Activities
 */
export const useIssueActivities = (workspaceId: string, issueId: string) => {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["issue-activities", issueId],
    queryFn: () =>
      getIssueActivities(workspaceId, issueId, session!.access_token),
    enabled: !!session?.access_token && !!issueId,
  });
};

export const useCreateIssueActivity = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workspaceId,
      issueId,
      data,
    }: {
      workspaceId: string;
      issueId: string;
      data: CreateIssueActivityDto;
    }) => {
      if (!session?.access_token) throw new Error("未授权");
      return createIssueActivity(
        workspaceId,
        issueId,
        data,
        session.access_token
      );
    },
    onSuccess: async (createdActivity, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issue-activities", variables.issueId],
      });

      if (!session?.access_token) {
        return;
      }

      await broadcastIssueActivityCreated(
        {
          issueId: variables.issueId,
          workspaceId: variables.workspaceId,
          activityId: createdActivity.id,
          actorId: createdActivity.actorId,
          action: createdActivity.action,
        },
        session.access_token,
      );
    },
  });
};
