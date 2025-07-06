// 根据实际API响应定义消息相关的类型
export interface ApiMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isDeleted: boolean;
  repliedToMessageId: string | null;
  sender: {
    id: string;
    teamId: string;
    userId: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    createdAt: string;
    updatedAt: string;
  };
  repliedToMessage: unknown;
}

interface FetchChatMessagesOptions {
  chatId: string;
  accessToken: string;
}

export async function fetchChatMessages({
  chatId,
  accessToken,
}: FetchChatMessagesOptions): Promise<ApiMessage[]> {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_DEV_URL}/chats/${chatId}/messages`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`);
  }

  const data: ApiMessage[] = await response.json();
  return data;
}
