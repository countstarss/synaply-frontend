import { CreateTeamDto, InviteMemberDto } from "@/api";

// MARK: - ✅团队
export interface Team {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  workspace: {
    id: string;
    name: string;
    type: string;
    user_id: string;
    team_id: string;
  };
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      email: string;
      user_id: string;
    };
  }>;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_DEV_URL || "http://localhost:5678";

/**
 * MARK: - ✅获取用户团队
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
 * MARK: - ✅创建新团队
 */
export const createTeam = async (
  data: CreateTeamDto,
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

/**
 * MARK: - ✅邀请团队成员
 */

export const inviteTeamMember = async (
  teamId: string,
  data: InviteMemberDto,
  token: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}/invite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "邀请成员失败");
  }

  return response.json();
};

// 团队成员相关接口
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: {
    id: string;
    name?: string;
    email: string;
    avatar_url?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * MARK: - ✅获取团队成员
 */
export const fetchTeamMembers = async (
  teamId: string,
  token: string
): Promise<TeamMember[]> => {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  return response.json();
};

/**
 * MARK: - ✅更新团队成员角色
 */
export const updateTeamMemberRole = async (
  teamId: string,
  memberUserId: string,
  role: "OWNER" | "ADMIN" | "MEMBER",
  token: string
): Promise<TeamMember> => {
  const response = await fetch(
    `${API_BASE_URL}/teams/${teamId}/members/${memberUserId}/role`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "更新成员角色失败");
  }

  return response.json();
};

/**
 * MARK: - ✅移除团队成员
 */
export const removeTeamMember = async (
  teamId: string,
  memberUserId: string,
  token: string
): Promise<{ message: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/teams/${teamId}/members/${memberUserId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "移除成员失败");
  }

  return response.json();
};

/**
 * MARK: - ✅获取团队详情
 */
export const fetchTeamById = async (
  teamId: string,
  token: string
): Promise<Team> => {
  const response = await fetch(`${API_BASE_URL}/teams/${teamId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("获取团队详情失败");
  }

  return response.json();
};
