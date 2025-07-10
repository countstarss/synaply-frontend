// MARK: - ✅工作区
export interface Workspace {
  id: string;
  name: string;
  type: "PERSONAL" | "TEAM";

  createdAt: string;
  updatedAt: string;

  userId?: string;
  teamId?: string;

  user?: {
    id: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
    members: Array<{
      id: string;
      role: string;
    }>;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_DEV_URL || "http://localhost:5678";

/**
 * MARK: - ✅获取用户所有空间
 */
export const fetchUserWorkspaces = async (
  token: string
): Promise<Workspace[]> => {
  const response = await fetch(`${API_BASE_URL}/workspaces`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("获取工作空间列表失败");
  }

  return response.json();
};

/**
 * MARK: 根据ID获取空间详情
 */
export const fetchWorkspaceById = async (
  workspaceId: string,
  token: string
): Promise<Workspace> => {
  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("获取工作空间详情失败");
  }

  return response.json();
};
