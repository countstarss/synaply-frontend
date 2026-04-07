"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  CreateProjectDto,
  UpdateProjectDto,
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
} from "@/lib/fetchers/project";

export const useProjects = (workspaceId: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      if (!session?.access_token) return [];
      return getProjects(workspaceId, session.access_token);
    },
    enabled: !!session?.access_token && !!workspaceId,
  });
};

export const useProject = (workspaceId: string, projectId: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["project", workspaceId, projectId],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return getProject(workspaceId, projectId, session.access_token);
    },
    enabled: !!session?.access_token && !!workspaceId && !!projectId,
  });
};

export const useCreateProject = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      data,
    }: {
      workspaceId: string;
      data: CreateProjectDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return createProject(workspaceId, data, session.access_token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.workspaceId],
      });
    },
  });
};

export const useUpdateProject = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      projectId,
      data,
    }: {
      workspaceId: string;
      projectId: string;
      data: UpdateProjectDto;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return updateProject(workspaceId, projectId, data, session.access_token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project", variables.workspaceId, variables.projectId],
      });
    },
  });
};

export const useDeleteProject = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      projectId,
    }: {
      workspaceId: string;
      projectId: string;
    }) => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return deleteProject(workspaceId, projectId, session.access_token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", variables.workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["project", variables.workspaceId, variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["issues", variables.workspaceId],
      });
    },
  });
};
