// MARK: - 用户信息
export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// MARK: - 用户公开信息
export interface PublicUserInfo {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_DEV_URL || "http://localhost:5678";

/**
 * 获取用户公开信息
 */
export const fetchUserById = async (
  userId: string,
  token: string
): Promise<PublicUserInfo> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("获取用户信息失败");
  }

  return response.json();
};

/**
 * 从邮箱中提取用户名作为fallback
 */
export const getUserNameFallback = (email: string): string => {
  return email.split("@")[0];
};
