import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Workflow } from "@/types/team";
import { Api, CreateWorkflowDto, UpdateWorkflowDto } from "@/api";
import {
  Workflow as PrismaWorkflow,
  // VisibilityType,
  WorkflowStatus,
} from "@/types/prisma";
import {
  prismaToTeamWorkflow,
  teamToPrismaWorkflow,
} from "@/lib/adapters/typeAdapters";

// 创建API实例
const createApi = (token: string) => {
  const api = new Api({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "",
    securityWorker: () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  });
  api.setSecurityData(token);
  return api;
};

/**
 * 获取工作空间下的所有工作流
 */
export const useWorkflows = (workspaceId: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["workflows", workspaceId],
    queryFn: async () => {
      const api = createApi(session!.access_token);
      const response = await api.workspaces.workflowControllerFindAll(
        workspaceId
      );

      if (!response.ok || !response.data!) {
        return [];
      }

      const workflows = response.data as unknown as PrismaWorkflow[];
      return workflows.map(prismaToTeamWorkflow);
    },
    enabled: !!session?.access_token && !!workspaceId,
    staleTime: 30 * 1000, // 30秒内认为数据新鲜
  });
};

/**
 * 获取单个工作流详情
 */
export const useWorkflowDetail = (
  workflowId: string | undefined,
  workspaceId: string
) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["workflow", workflowId, workspaceId],
    queryFn: async () => {
      if (!workflowId) return null;

      const api = createApi(session!.access_token);
      const response = await api.workspaces.workflowControllerFindOne(
        workflowId,
        workspaceId
      );

      if (!response.ok || !response.data!) {
        return null;
      }

      return prismaToTeamWorkflow(response.data as unknown as PrismaWorkflow);
    },
    enabled: !!session?.access_token && !!workspaceId && !!workflowId,
  });
};

/**
 * 创建工作流
 */
export const useCreateWorkflow = (workspaceId: string) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workflow: Partial<Workflow>) => {
      const api = createApi(session!.access_token);
      const prismaWorkflow = teamToPrismaWorkflow(workflow as Workflow);

      const workflowData: CreateWorkflowDto = {
        name: prismaWorkflow.name || "未命名工作流",
        visibility: prismaWorkflow.visibility as
          | "PRIVATE"
          | "TEAM_READONLY"
          | "TEAM_EDITABLE"
          | "PUBLIC",
      };

      const response = await api.workspaces.workflowControllerCreate(
        workspaceId,
        workflowData
      );

      if (!response.ok || !response.data!) {
        throw new Error("创建工作流失败");
      }

      // 创建成功后，更新工作流的JSON数据
      const createdWorkflow = response.data as unknown as PrismaWorkflow;

      if (createdWorkflow.id) {
        const updateResponse = await api.workspaces.workflowControllerUpdate(
          createdWorkflow.id,
          workspaceId,
          {
            status:
              prismaWorkflow.status === WorkflowStatus.PUBLISHED
                ? "PUBLISHED"
                : "DRAFT",
            steps: [], // 使用空数组，实际数据在json字段中
          }
        );

        if (!updateResponse.ok || !updateResponse.data!) {
          throw new Error("更新工作流JSON数据失败");
        }

        return prismaToTeamWorkflow(
          updateResponse.data as unknown as PrismaWorkflow
        );
      }

      return prismaToTeamWorkflow(createdWorkflow);
    },
    onSuccess: () => {
      // 创建成功后，刷新工作流列表
      queryClient.invalidateQueries({ queryKey: ["workflows", workspaceId] });
    },
  });
};

/**
 * 更新工作流
 */
export const useUpdateWorkflow = (workspaceId: string) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workflowId,
      workflow,
    }: {
      workflowId: string;
      workflow: Partial<Workflow>;
    }) => {
      const api = createApi(session!.access_token);
      const prismaWorkflow = teamToPrismaWorkflow(workflow as Workflow);

      const updateData: UpdateWorkflowDto = {
        status:
          prismaWorkflow.status === WorkflowStatus.PUBLISHED
            ? "PUBLISHED"
            : "DRAFT",
        steps: [], // 使用空数组，实际数据在json字段中
      };

      const response = await api.workspaces.workflowControllerUpdate(
        workflowId,
        workspaceId,
        updateData
      );

      if (!response.ok || !response.data!) {
        throw new Error("更新工作流失败");
      }

      return prismaToTeamWorkflow(response.data as unknown as PrismaWorkflow);
    },
    onSuccess: (_, variables) => {
      // 更新成功后，刷新工作流列表和详情
      queryClient.invalidateQueries({ queryKey: ["workflows", workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ["workflow", variables.workflowId, workspaceId],
      });
    },
  });
};

/**
 * 删除工作流
 */
export const useDeleteWorkflow = (workspaceId: string) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workflowId: string) => {
      const api = createApi(session!.access_token);
      const response = await api.workspaces.workflowControllerRemove(
        workflowId,
        workspaceId
      );

      if (!response.ok) {
        throw new Error("删除工作流失败");
      }

      return workflowId;
    },
    onSuccess: () => {
      // 删除成功后，刷新工作流列表
      queryClient.invalidateQueries({ queryKey: ["workflows", workspaceId] });
    },
  });
};

/**
 * 发布工作流
 */
export const usePublishWorkflow = (workspaceId: string) => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workflowId: string) => {
      const api = createApi(session!.access_token);
      const response = await api.workspaces.workflowControllerPublish(
        workflowId,
        workspaceId
      );

      if (!response.ok) {
        throw new Error("发布工作流失败");
      }

      return workflowId;
    },
    onSuccess: (workflowId) => {
      // 发布成功后，刷新工作流列表和详情
      queryClient.invalidateQueries({ queryKey: ["workflows", workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ["workflow", workflowId, workspaceId],
      });
    },
  });
};
