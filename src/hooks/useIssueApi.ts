import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  CreateIssueDto,
  CreateWorkflowIssueDto,
  createIssue,
  createWorkflowIssue,
  getIssues,
} from "@/lib/fetchers/issue";
import { IssueStatus } from "@/types/prisma";

/**
 * 获取工作空间下的所有Issue
 */
export const useIssues = (workspaceId: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["issues", workspaceId],
    queryFn: async () => {
      if (!session?.access_token) return [];
      return getIssues(workspaceId, session.access_token);
    },
    enabled: !!session?.access_token && !!workspaceId,
  });
};

/**
 * 创建普通Issue
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
        directAssigneeId: issue.directAssigneeId,
        dueDate: issue.dueDate,
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
 * 创建基于工作流的Issue
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
        }
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
        workflowId,
        workflowSnapshot: JSON.stringify(workflowJson),
        totalSteps: nodes.length,
        currentStepId: firstNode.id,
        currentStepIndex: 0,
        currentStepStatus: IssueStatus.TODO,
      };

      return createWorkflowIssue(issueData, session.access_token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
      });
    },
  });
};
