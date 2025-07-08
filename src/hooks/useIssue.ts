import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Issue } from "@/types/team";
import {
  createIssue,
  createWorkflowIssue,
  fetchIssues,
  fetchIssueById,
  updateIssue,
  deleteIssue,
  addIssueComment,
  addIssueDependency,
} from "@/lib/fetchers/issue";

/**
 * 获取工作空间下的所有Issue
 */
export const useIssues = (workspaceId: string, projectId?: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["issues", workspaceId, projectId],
    queryFn: () => fetchIssues(session!.access_token, workspaceId, projectId),
    enabled: !!session?.access_token && !!workspaceId,
    staleTime: 30 * 1000, // 30秒内认为数据新鲜
  });
};

/**
 * 获取单个Issue详情
 */
export const useIssueDetail = (
  issueId: string | undefined,
  workspaceId: string
) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["issue", issueId, workspaceId],
    queryFn: () => fetchIssueById(issueId!, session!.access_token, workspaceId),
    enabled: !!session?.access_token && !!issueId && !!workspaceId,
    staleTime: 30 * 1000, // 30秒内认为数据新鲜
  });
};

/**
 * 创建Issue
 */
export const useCreateIssue = (workspaceId: string) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (issueData: Partial<Issue>) =>
      createIssue(issueData, session!.access_token, workspaceId),
    onSuccess: () => {
      // 创建成功后刷新Issue列表
      queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
    },
  });
};

/**
 * 创建工作流Issue
 */
export const useCreateWorkflowIssue = (workspaceId: string) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueData,
      workflowId,
    }: {
      issueData: Partial<Issue>;
      workflowId: string;
    }) =>
      createWorkflowIssue(
        issueData,
        workflowId,
        session!.access_token,
        workspaceId
      ),
    onSuccess: () => {
      // 创建成功后刷新Issue列表
      queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
    },
  });
};

/**
 * 更新Issue
 */
export const useUpdateIssue = (workspaceId: string) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueId,
      updateData,
    }: {
      issueId: string;
      updateData: Partial<Issue>;
    }) => updateIssue(issueId, updateData, session!.access_token, workspaceId),
    onSuccess: (data, variables) => {
      // 更新成功后刷新Issue列表和Issue详情
      queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ["issue", variables.issueId, workspaceId],
      });
    },
  });
};

/**
 * 删除Issue
 */
export const useDeleteIssue = (workspaceId: string) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (issueId: string) =>
      deleteIssue(issueId, session!.access_token, workspaceId),
    onSuccess: () => {
      // 删除成功后刷新Issue列表
      queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
    },
  });
};

/**
 * 添加Issue评论
 */
export const useAddIssueComment = (workspaceId: string) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, content }: { issueId: string; content: string }) =>
      addIssueComment(issueId, content, session!.access_token, workspaceId),
    onSuccess: (_, variables) => {
      // 添加评论成功后刷新Issue详情
      queryClient.invalidateQueries({
        queryKey: ["issue", variables.issueId, workspaceId],
      });
    },
  });
};

/**
 * 添加Issue依赖
 */
export const useAddIssueDependency = (workspaceId: string) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      issueId,
      dependsOnIssueId,
    }: {
      issueId: string;
      dependsOnIssueId: string;
    }) =>
      addIssueDependency(
        issueId,
        dependsOnIssueId,
        session!.access_token,
        workspaceId
      ),
    onSuccess: (_, variables) => {
      // 添加依赖成功后刷新Issue详情
      queryClient.invalidateQueries({
        queryKey: ["issue", variables.issueId, workspaceId],
      });
    },
  });
};
