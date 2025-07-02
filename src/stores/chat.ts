import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  timestamp: number;
  edited?: boolean;
  reactions?: { emoji: string; users: string[] }[];
}

export interface ChatChannel {
  id: string;
  name: string;
  type: "public" | "private" | "dm";
  messages: ChatMessage[];
  lastActivity: number;
}

interface ChatState {
  // 显示控制
  isVisible: boolean;
  isInitialized: boolean;

  // 缓存状态
  channels: Record<string, ChatChannel>;
  currentChannelId: string;

  // UI状态
  sidebarOpen: boolean;

  // 缓存的用户状态
  cachedUsers: Array<{
    id: string;
    username: string;
    avatarUrl?: string;
    isOnline: boolean;
  }>;

  // Actions
  showChat: () => void;
  hideChat: () => void;
  initializeChat: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCurrentChannel: (channelId: string) => void;
  addMessage: (channelId: string, message: ChatMessage) => void;
  clearCache: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // 初始状态
      isVisible: false,
      isInitialized: false,
      channels: {
        public: {
          id: "public",
          name: "Public",
          type: "public",
          messages: [],
          lastActivity: Date.now(),
        },
      },
      currentChannelId: "public",
      sidebarOpen: false,
      cachedUsers: [],

      // 显示控制
      showChat: () => {
        set({ isVisible: true });
        // 如果还没初始化，则触发初始化
        if (!get().isInitialized) {
          get().initializeChat();
        }
      },

      hideChat: () => {
        set({ isVisible: false });
      },

      // 初始化Chat（缓存基础数据）
      initializeChat: () => {
        set((state) => {
          if (state.isInitialized) return state;

          console.log("🚀 初始化Chat缓存...");

          // 预缓存一些用户数据
          const mockUsers = [
            {
              id: "1",
              username: "Alice",
              avatarUrl: "/avatars/1.jpg",
              isOnline: true,
            },
            {
              id: "2",
              username: "Bob",
              avatarUrl: "/avatars/2.jpg",
              isOnline: false,
            },
            {
              id: "3",
              username: "Charlie",
              avatarUrl: "/avatars/3.jpg",
              isOnline: true,
            },
          ];

          // 预缓存一些消息
          const mockMessages: ChatMessage[] = [
            {
              id: "1",
              content: "Welcome to the public channel!",
              userId: "1",
              username: "Alice",
              avatarUrl: "/avatars/1.jpg",
              timestamp: Date.now() - 1000 * 60 * 5,
            },
            {
              id: "2",
              content: "Hello everyone!",
              userId: "2",
              username: "Bob",
              avatarUrl: "/avatars/2.jpg",
              timestamp: Date.now() - 1000 * 60 * 2,
            },
          ];

          return {
            ...state,
            isInitialized: true,
            cachedUsers: mockUsers,
            channels: {
              ...state.channels,
              public: {
                ...state.channels["public"],
                messages: mockMessages,
              },
            },
          };
        });
      },

      // UI控制
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // 频道管理
      setCurrentChannel: (channelId: string) =>
        set({ currentChannelId: channelId }),

      // 消息管理
      addMessage: (channelId: string, message: ChatMessage) => {
        set((state) => ({
          channels: {
            ...state.channels,
            [channelId]: {
              ...state.channels[channelId],
              messages: [
                ...(state.channels[channelId]?.messages || []),
                message,
              ],
              lastActivity: Date.now(),
            },
          },
        }));
      },

      // 清除缓存
      clearCache: () => {
        set({
          isInitialized: false,
          channels: {
            public: {
              id: "public",
              name: "Public",
              type: "public",
              messages: [],
              lastActivity: Date.now(),
            },
          },
          cachedUsers: [],
        });
      },
    }),
    {
      name: "chat-storage",
      // 只持久化需要的数据，不包括isVisible
      partialize: (state) => ({
        channels: state.channels,
        currentChannelId: state.currentChannelId,
        cachedUsers: state.cachedUsers,
        isInitialized: state.isInitialized,
      }),
      // 24小时过期
      version: 1,
    }
  )
);
