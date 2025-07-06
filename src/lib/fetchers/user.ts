export interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FetchUserInfoOptions {
  userId: string;
  accessToken: string;
}

export async function fetchUserInfo({
  userId,
  accessToken,
}: FetchUserInfoOptions): Promise<UserInfo> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_DEV_URL}/users/${userId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info: ${response.statusText}`);
  }

  const data: UserInfo = await response.json();
  return data;
}
