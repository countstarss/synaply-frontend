import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  CreateIssueDto,
  CreateWorkflowIssueDto,
  getIssue,
  IssueQueryParams,
  createIssue,
  createWorkflowIssue,
  getIssues,
  updateIssue,
  deleteIssue,
  Issue,
  isWorkflowIssue,
  createIssueStepRecord,
  getIssueStepRecords,
  CreateIssueStepRecordDto,
  createIssueActivity,
  getIssueActivities,
  CreateIssueActivityDto,
} from "@/lib/fetchers/issue";
import { IssueStatus, IssueType } from "@/types/prisma";

function buildWorkflowIssuePatch(issue: Partial<CreateIssueDto>) {
  const patch: Partial<Issue> = {};

  if (issue.stateId !== undefined) {
    patch.stateId = issue.stateId;
  }

  if (issue.projectId !== undefined) {
    patch.projectId = issue.projectId ?? null;
  }

  if (issue.directAssigneeId !== undefined) {
    patch.directAssigneeId = issue.directAssigneeId ?? null;
  }

  if (issue.dueDate !== undefined) {
    patch.dueDate = issue.dueDate ?? null;
  }

  if (issue.priority !== undefined) {
    patch.priority = issue.priority;
  }

  if (issue.visibility !== undefined) {
    patch.visibility = issue.visibility;
  }

  return patch;
}

function workflowIssueNeedsPatch(issue: Issue | null, patch: Partial<Issue>) {
  return Object.entries(patch).some(([key, value]) => {
    const currentValue = issue?.[key as keyof Issue];
    return (currentValue ?? null) !== (value ?? null);
  });
}

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
      });
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

      // 获取工作流数据
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_BACKEND_DEV_URL || "http://localhost:5678"
        }/workspaces/${workspaceId}/workflows/${workflowId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("获取工作流数据失败");
      }

      const workflow = await response.json();
      const workflowJson = workflow.json
        ? typeof workflow.json === "string"
          ? JSON.parse(workflow.json)
          : workflow.json
        : { nodes: [], edges: [] };

      // 找到第一个节点作为起始节点
      const nodes = workflowJson.nodes || [];
      const firstNode = nodes.length > 0 ? nodes[0] : null;

      if (!firstNode) {
        throw new Error("工作流没有定义节点");
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
        workflowSnapshot: JSON.stringify(workflowJson),
        totalSteps: nodes.length,
        currentStepId: firstNode.id,
        currentStepIndex: 0,
        currentStepStatus: IssueStatus.TODO,
      };

      const createdIssue = await createWorkflowIssue(issueData, session.access_token);

      if (!createdIssue?.id) {
        return createdIssue;
      }

      const freshIssue = await getIssue(
        workspaceId,
        createdIssue.id,
        session.access_token,
      );
      const patch = buildWorkflowIssuePatch(issue);

      if (
        freshIssue?.id &&
        Object.keys(patch).length > 0 &&
        workflowIssueNeedsPatch(freshIssue, patch)
      ) {
        await updateIssue(workspaceId, freshIssue.id, patch, session.access_token);
        return getIssue(workspaceId, freshIssue.id, session.access_token);
      }

      if (!freshIssue) {
        return freshIssue;
      }

      return isWorkflowIssue(freshIssue)
        ? freshIssue
        : {
            ...freshIssue,
            issueType: IssueType.WORKFLOW,
          };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
      });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
      });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issue-step-records", variables.issueId],
      });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issue-activities", variables.issueId],
      });
    },
  });
};
