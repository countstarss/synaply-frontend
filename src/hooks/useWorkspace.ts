"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  fetchUserWorkspaces,
  Workspace as APIWorkspace,
} from "@/lib/fetchers/workspace";

export interface Workspace {
  id: string;
  name: string;
  type: "PERSONAL" | "TEAM";
  memberCount?: number;
  isActive: boolean;
  avatarUrl?: string;
  teamId?: string;
  userId?: string;
}

export function useWorkspace() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { currentWorkspaceId, setCurrentWorkspaceId } = useWorkspaceStore();

  // 获取用户所有工作空间
  const {
    data: apiWorkspaces,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workspaces", session?.user?.id],
    queryFn: () => fetchUserWorkspaces(session!.access_token),
    enabled: !!session?.access_token,
    retry: 1,
  });

  // 转换API数据为前端格式
  const workspaces: Workspace[] = (apiWorkspaces || []).map(
    (workspace: APIWorkspace) => ({
      id: workspace.id,
      name:
        workspace.type === "TEAM"
          ? workspace.team?.name || workspace.name
          : workspace.name,
      type: workspace.type,
      memberCount:
        workspace.type === "TEAM" ? workspace.team?.members?.length || 1 : 1,
      isActive: workspace.id === currentWorkspaceId,
      avatarUrl:
        workspace.type === "TEAM"
          ? workspace.team?.avatarUrl || undefined
          : workspace.user?.avatarUrl || undefined,
      teamId: workspace.teamId,
      userId: workspace.userId,
    })
  );

  // 初始化当前工作空间
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspaceId) {
      // 尝试从本地存储获取上次选择的工作空间
      const savedWorkspaceId = localStorage.getItem("currentWorkspaceId");
      const savedWorkspace = workspaces.find((w) => w.id === savedWorkspaceId);

      if (savedWorkspace) {
        setCurrentWorkspaceId(savedWorkspaceId);
      } else {
        // 优先选择个人工作空间，如果没有则选择第一个
        const personalWorkspace = workspaces.find((w) => w.type === "PERSONAL");
        setCurrentWorkspaceId(personalWorkspace?.id || workspaces[0].id);
      }
    }
  }, [workspaces, currentWorkspaceId, setCurrentWorkspaceId]);

  // 获取当前工作空间
  const currentWorkspace =
    workspaces.find((w) => w.id === currentWorkspaceId) || null;

  // 切换工作空间
  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      setCurrentWorkspaceId(workspaceId);
      localStorage.setItem("currentWorkspaceId", workspaceId);
    }
  };

  // 创建新工作空间
  const createWorkspace = async (name: string, type: "PERSONAL" | "TEAM") => {
    // TODO: 调用API创建工作空间
    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name,
      type,
      memberCount: 1,
      isActive: false,
    };

    // 这里需要调用API创建工作空间后再刷新数据
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    return newWorkspace;
  };

  // 邀请成员到当前工作空间
  const inviteMember = async (email: string) => {
    // TODO: 调用API邀请成员
    console.log("邀请成员:", email, "到工作空间:", currentWorkspace?.name);
  };

  return {
    workspaces,
    currentWorkspace,
    loading,
    error,
    refetch,
    switchWorkspace,
    createWorkspace,
    inviteMember,
  };
}
