"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export interface Workspace {
  id: string;
  name: string;
  type: "PERSONAL" | "TEAM";
  memberCount?: number;
  isActive: boolean;
  avatarUrl?: string;
}

// 模拟工作空间数据 - 稍后可以替换为API调用
const mockWorkspaces: Workspace[] = [
  {
    id: "1",
    name: "InsightLab",
    type: "TEAM",
    memberCount: 5,
    isActive: true,
  },
  {
    id: "2",
    name: "wiz Lab",
    type: "TEAM",
    memberCount: 3,
    isActive: false,
  },
];

export function useWorkspace() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  // 初始化工作空间数据
  useEffect(() => {
    if (user) {
      // TODO: 从API获取用户的工作空间列表
      setWorkspaces(mockWorkspaces);
      setCurrentWorkspace(mockWorkspaces[0]);
    }
    setLoading(false);
  }, [user]);

  // 切换工作空间
  const switchWorkspace = (workspaceId: string) => {
    const workspace = workspaces.find((w) => w.id === workspaceId);
    if (workspace) {
      // 更新当前活跃状态
      const updatedWorkspaces = workspaces.map((w) => ({
        ...w,
        isActive: w.id === workspaceId,
      }));

      setWorkspaces(updatedWorkspaces);
      setCurrentWorkspace(workspace);

      // TODO: 更新本地存储或发送API请求
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

    setWorkspaces((prev) => [...prev, newWorkspace]);
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
    switchWorkspace,
    createWorkspace,
    inviteMember,
  };
}
