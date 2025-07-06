// Team相关的API fetchers
export interface Team {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  workspace: {
    id: string;
    name: string;
    type: string;
  };
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      email: string;
    };
  }>;
}

export interface CreateTeamData {
  name: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_DEV_URL || "http://localhost:5678";

/**
 * MARK: - 获取用户所有团队
 */
export const fetchUserTeams = async (token: string): Promise<Team[]> => {
  const response = await fetch(`${API_BASE_URL}/teams`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("获取团队列表失败");
  }

  return response.json();
};

/**
 * MARK: - 创建新团队
 */
export const createTeam = async (
  data: CreateTeamData,
  token: string
): Promise<Team> => {
  const response = await fetch(`${API_BASE_URL}/teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("创建团队失败");
  }

  return response.json();
};
