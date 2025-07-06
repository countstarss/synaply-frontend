import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { createApiClient } from "@/lib/api-client";
import { CreateGroupChatDto, CreatePrivateChatDto } from "@/api";

// 定义聊天返回类型
export interface ChatResult {
  id: string;
  type: "GROUP" | "PRIVATE";
  name?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatDetails extends ChatResult {
  members?: Array<{
    id: string;
    teamMember: {
      id: string;
      user: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
      };
    };
  }>;
}

// 创建API客户端
const createChatApiClient = (token: string) => {
  return createApiClient(token);
};

// 获取用户所有聊天
export const useUserChats = (type?: "private" | "group") => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["user-chats", type],
    queryFn: async () => {
      if (!session?.access_token) throw new Error("未授权");

      const api = createChatApiClient(session.access_token);
      const response = await api.chats.chatControllerFindAllChats({
        type: type || "private",
      });
      return response.data as ChatResult[];
    },
    enabled: !!session?.access_token,
  });
};

// 获取聊天详情
export const useChat = (chatId: string) => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      if (!session?.access_token) throw new Error("未授权");

      const api = createChatApiClient(session.access_token);
      const response = await api.chats.chatControllerFindOneChat(chatId);
      return response.data as ChatDetails;
    },
    enabled: !!session?.access_token && !!chatId,
  });
};

// 创建群聊
export const useCreateGroupChat = () => {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateGroupChatDto) => {
      if (!session?.access_token) throw new Error("未授权");

      const api = createChatApiClient(session.access_token);
      const response = await api.chats.chatControllerCreateGroupChat(data);
      return response.data as ChatResult;
    },
  });
};

// 创建私聊
export const useCreatePrivateChat = () => {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (data: CreatePrivateChatDto) => {
      if (!session?.access_token) throw new Error("未授权");

      const api = createChatApiClient(session.access_token);
      const response = await api.chats.chatControllerCreatePrivateChat(data);
      return response.data as ChatResult;
    },
  });
};

// 删除聊天
export const useDeleteChat = () => {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (chatId: string) => {
      if (!session?.access_token) throw new Error("未授权");

      const api = createChatApiClient(session.access_token);
      const response = await api.chats.chatControllerDeleteChat(chatId);
      return response.data;
    },
  });
};

// 添加群聊成员
export const useAddChatMembers = () => {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({
      chatId,
      memberIds,
    }: {
      chatId: string;
      memberIds: string[];
    }) => {
      if (!session?.access_token) throw new Error("未授权");

      const api = createChatApiClient(session.access_token);
      const response = await api.chats.chatControllerAddMembersToGroupChat(
        chatId,
        {
          memberIds,
        }
      );
      return response.data;
    },
  });
};

// 移除群聊成员
export const useRemoveChatMember = () => {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async ({
      chatId,
      teamMemberId,
    }: {
      chatId: string;
      teamMemberId: string;
    }) => {
      if (!session?.access_token) throw new Error("未授权");

      const api = createChatApiClient(session.access_token);
      const response = await api.chats.chatControllerRemoveMemberFromGroupChat(
        chatId,
        teamMemberId
      );
      return response.data;
    },
  });
};

// 退出群聊
export const useLeaveGroupChat = () => {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (chatId: string) => {
      if (!session?.access_token) throw new Error("未授权");

      const api = createChatApiClient(session.access_token);
      const response = await api.chats.chatControllerLeaveGroupChat(chatId);
      return response.data;
    },
  });
};
