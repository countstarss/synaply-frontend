const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_DEV_URL || "http://localhost:5678";

// 聊天类型定义
export interface Chat {
  id: string;
  type: "GROUP" | "PRIVATE";
  name?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  last_message?: {
    id: string;
    content: string;
    created_at: string;
    sender: {
      id: string;
      user: {
        name?: string;
        email: string;
      };
    };
  };
  members: Array<{
    id: string;
    team_member: {
      id: string;
      user: {
        id: string;
        name?: string;
        email: string;
        avatar_url?: string;
      };
    };
  }>;
}

export interface CreateGroupChatData {
  name: string;
  description?: string;
  memberIds: string[];
}

export interface CreatePrivateChatData {
  targetMemberId: string;
}

export interface ChatResponse {
  id: string;
}

/**
 * 获取用户所有聊天
 */
export const fetchUserChats = async (token: string): Promise<Chat[]> => {
  const response = await fetch(`${API_BASE_URL}/chats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("获取聊天列表失败");
  }

  return response.json();
};

/**
 * 创建群聊
 */
export const createGroupChat = async (
  data: CreateGroupChatData,
  token: string
): Promise<ChatResponse> => {
  const response = await fetch(`${API_BASE_URL}/chats/group`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("创建群聊失败");
  }

  return response.json();
};

/**
 * 创建或获取私聊
 */
export const createPrivateChat = async (
  data: CreatePrivateChatData,
  token: string
): Promise<ChatResponse> => {
  const response = await fetch(`${API_BASE_URL}/chats/private`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("创建私聊失败");
  }

  return response.json();
};

/**
 * 获取聊天详情
 */
export const fetchChatById = async (
  chatId: string,
  token: string
): Promise<Chat> => {
  const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("获取聊天详情失败");
  }

  return response.json();
};
