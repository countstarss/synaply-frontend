"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import MessageInput from "./message-input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClientComponentClient } from "@/lib/supabase";
import { useLiveQuery } from "dexie-react-hooks";
import { LocalChatMessage } from "@/lib/local-db";
import { useLocalDb } from "@/providers/local-db-provider";
import { v4 as uuidv4 } from "uuid";
import { useQuery } from "@tanstack/react-query";
import { fetchChatMessages, ApiMessage } from "@/lib/fetchers/message";
import { fetchUserInfo, UserInfo } from "@/lib/fetchers/user";

// 消息类型定义
interface Message extends LocalChatMessage {
  id: string;
  sender?: {
    id: string;
    user?: {
      name?: string;
      avatar_url?: string;
    };
  };
}

// 暂时注释掉，因为Realtime功能暂时禁用
// interface RealtimeMessage {
//   id: string;
//   chat_id: string;
//   sender_id: string;
//   content: string;
//   created_at: string;
//   type?: string;
// }

interface LocalDbDebugInfo {
  totalMessages: number;
  chatMessages: number;
  chatMessagesSample: Array<{
    id: string;
    senderId: string;
    content: string;
    createdAt: number;
  }>;
  allChats: string[];
  error?: string;
}

interface SupabaseChatRoomProps {
  chatId: string;
  type: "private" | "group";
  chatName: string;
}

export function SupabaseChatRoom({
  chatId,
  type,
  chatName,
}: SupabaseChatRoomProps) {
  const { session, user } = useAuth();
  const supabase = createClientComponentClient();
  const localDb = useLocalDb();

  const [newMessageContent, setNewMessageContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userCache, setUserCache] = useState<Map<string, UserInfo>>(new Map());
  const [senderUserMap, setSenderUserMap] = useState<Map<string, UserInfo>>(
    new Map()
  );
  const [isMessagesSynced, setIsMessagesSynced] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [localDbDebugInfo, setLocalDbDebugInfo] =
    useState<LocalDbDebugInfo | null>(null);

  // 获取当前用户的团队成员ID
  useEffect(() => {
    const getCurrentUserId = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_DEV_URL}/teams/by-user-id/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          }
        );

        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.id); // 获取 TeamMember 的 ID
        } else {
          console.error("Error fetching team member ID:", response.statusText);
        }
      } catch (error) {
        console.error("Error getting current user ID:", error);
      }
    };

    getCurrentUserId();
  }, [user?.id, session?.access_token]);

  // 从本地数据库实时查询消息
  const messages = useLiveQuery(
    () => localDb.messages.where({ chatId }).sortBy("createdAt"),
    [chatId, localDb]
  ) as Message[] | undefined;

  // 使用 react-query 获取历史消息
  const {
    data: apiMessages,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery<ApiMessage[]>({
    queryKey: ["chatMessages", chatId, session?.access_token],
    queryFn: () =>
      fetchChatMessages({
        chatId,
        accessToken: session?.access_token || "",
      }),
    enabled: !!chatId && !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
    gcTime: 1 * 60 * 1000, // 1分钟后清除缓存 (在新版本中是gcTime)
  });

  // 获取用户信息的辅助函数 - 使用ref避免依赖项循环
  const userCacheRef = useRef<Map<string, UserInfo>>(new Map());

  const getUserInfo = useCallback(
    async (userId: string): Promise<UserInfo | null> => {
      if (userCacheRef.current.has(userId)) {
        return userCacheRef.current.get(userId)!;
      }

      try {
        const userInfo = await fetchUserInfo({
          userId,
          accessToken: session?.access_token || "",
        });

        // 更新ref和state
        userCacheRef.current.set(userId, userInfo);
        setUserCache(new Map(userCacheRef.current));

        return userInfo;
      } catch (error) {
        console.error(`Error fetching user info for ${userId}:`, error);
        return null;
      }
    },
    [session?.access_token]
  );

  // 处理获取到的消息数据 - 简化同步逻辑，分离用户信息获取
  useEffect(() => {
    if (
      !apiMessages ||
      !Array.isArray(apiMessages) ||
      apiMessages.length === 0
    ) {
      console.log("No API messages to sync");
      return;
    }

    if (isMessagesSynced) {
      console.log("Messages already synced, skipping...");
      return;
    }

    const syncMessages = async () => {
      try {
        console.log("Starting message sync...", {
          apiCount: apiMessages.length,
          chatId,
          isMessagesSynced,
        });

        // 检查本地现有消息
        const existingMessages = await localDb.messages
          .where({ chatId })
          .toArray();
        console.log("Existing local messages:", existingMessages.length);

        // 获取API消息的ID集合
        const apiMessageIds = new Set(apiMessages.map((msg) => msg.id));
        const localMessageIds = new Set(existingMessages.map((msg) => msg.id));

        // 如果消息ID完全匹配，跳过同步
        const hasAllMessages =
          apiMessageIds.size === localMessageIds.size &&
          [...apiMessageIds].every((id) => localMessageIds.has(id));

        if (hasAllMessages) {
          console.log("Messages already synchronized, skipping...");
          setIsMessagesSynced(true);
          return;
        }

        console.log("Syncing messages...");

        // 准备本地消息数据 - 暂时不获取用户信息，先插入基本数据
        const localMessages: LocalChatMessage[] = apiMessages.map((msg) => ({
          id: msg.id,
          chatId: msg.chatId,
          senderId: msg.senderId,
          senderName: "Loading...", // 稍后异步更新
          content: msg.content,
          createdAt: new Date(msg.createdAt).getTime(),
          type:
            msg.type === "TEXT" || msg.type === "IMAGE" || msg.type === "FILE"
              ? (msg.type.toLowerCase() as "text" | "image" | "file")
              : "text",
          status: "sent",
        }));

        // 使用事务：先删除当前聊天的消息，然后使用 bulkPut
        await localDb.transaction("rw", localDb.messages, async () => {
          // 删除当前聊天的所有消息
          await localDb.messages.where({ chatId }).delete();

          // 使用 bulkPut 代替 bulkAdd，这样可以覆盖已存在的记录
          await localDb.messages.bulkPut(localMessages);
        });

        setIsMessagesSynced(true);
        console.log("Messages synced successfully:", localMessages.length);
      } catch (error) {
        console.error("Error syncing messages to local DB:", error);
        setIsMessagesSynced(false);

        // 如果还是有错误，尝试逐个插入
        try {
          console.log("Trying individual message insertion...");
          await localDb.messages.where({ chatId }).delete();

          for (const msg of apiMessages) {
            const localMessage: LocalChatMessage = {
              id: msg.id,
              chatId: msg.chatId,
              senderId: msg.senderId,
              senderName: "Loading...",
              content: msg.content,
              createdAt: new Date(msg.createdAt).getTime(),
              type:
                msg.type === "TEXT" ||
                msg.type === "IMAGE" ||
                msg.type === "FILE"
                  ? (msg.type.toLowerCase() as "text" | "image" | "file")
                  : "text",
              status: "sent",
            };

            try {
              await localDb.messages.put(localMessage);
            } catch (putError) {
              console.error("Error inserting individual message:", putError);
            }
          }

          setIsMessagesSynced(true);
          console.log("Individual insertion completed");
        } catch (fallbackError) {
          console.error("Fallback insertion also failed:", fallbackError);
        }
      }
    };

    syncMessages();
  }, [apiMessages, chatId, isMessagesSynced, localDb]);

  // 分离的用户信息获取 - 在消息同步后异步获取用户信息
  useEffect(() => {
    if (!apiMessages || !Array.isArray(apiMessages) || !isMessagesSynced)
      return;

    const updateUserInfo = async () => {
      try {
        console.log("Updating user information...");
        const tempSenderUserMap = new Map<string, UserInfo>();

        // 异步获取所有用户信息
        for (const msg of apiMessages) {
          // 直接调用getUserInfo，而不依赖useCallback的返回值
          const userInfo = await getUserInfo(msg.sender.userId);
          if (userInfo) {
            tempSenderUserMap.set(msg.senderId, userInfo);

            // 更新消息的发送者名称
            try {
              await localDb.messages.update(msg.id, {
                senderName: userInfo.name || userInfo.email || "Unknown User",
              });
            } catch (updateError) {
              console.error("Error updating message sender name:", updateError);
            }
          }
        }

        // 更新发送者用户映射
        setSenderUserMap(tempSenderUserMap);
        console.log("User information updated successfully");
      } catch (error) {
        console.error("Error updating user information:", error);
      }
    };

    // 延迟执行用户信息更新，确保消息已经在数据库中
    const timeoutId = setTimeout(updateUserInfo, 200);
    return () => clearTimeout(timeoutId);
  }, [apiMessages, isMessagesSynced]);

  // 重置同步状态当chatId变化时
  useEffect(() => {
    console.log("ChatId changed, resetting sync state:", chatId);
    setIsMessagesSynced(false);
    setSenderUserMap(new Map());
    userCacheRef.current.clear();
    setUserCache(new Map());
  }, [chatId]);

  // 处理错误
  useEffect(() => {
    if (messagesError) {
      console.error("Error fetching messages with react-query:", messagesError);
    }
  }, [messagesError]);

  // MARK: Supabase Realtime 订阅 - 暂时禁用由于权限问题
  useEffect(() => {
    // 暂时禁用Realtime功能，因为权限问题导致连接断开
    console.log("⚠️ Realtime temporarily disabled due to permission issues");
    console.log(
      "💡 To enable Realtime, please configure RLS policies in Supabase"
    );
    console.log("📋 Steps to fix:");
    console.log("1. Go to Supabase Dashboard → Authentication → Policies");
    console.log("2. Create RLS policy for 'messages' table allowing SELECT");
    console.log(
      "3. Go to Database → Replication and enable Realtime for 'messages'"
    );

    // 当需要启用Realtime时，移除下面的return语句
    // return;
  }, []);

  // MARK: scrollToBottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: behavior,
          });
        }, 0);
      }
    }
  }, []);

  // 初始加载时立即滚动到底部
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => scrollToBottom("instant"), 100);
    }
  }, [messages, scrollToBottom]);

  // MARK: handleSend
  const handleSend = async (content: string) => {
    if (!session || !content.trim() || !currentUserId) return;

    const tempMessageId = uuidv4();

    // 乐观更新本地消息列表
    const optimisticMessage: LocalChatMessage = {
      id: tempMessageId,
      chatId: chatId,
      senderId: currentUserId,
      senderName:
        user?.user_metadata?.name || user?.email?.split("@")[0] || "Me",
      content: content,
      createdAt: Date.now(),
      type: "text",
      status: "sending",
    };

    try {
      await localDb.messages.add(optimisticMessage);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_DEV_URL}/chats/${chatId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            content: content,
            type: "TEXT",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data) {
        // 消息发送成功，更新本地消息的 ID 和状态
        await localDb.messages.update(tempMessageId, {
          id: data.id,
          status: "sent",
        });
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
      await localDb.messages.update(tempMessageId, { status: "failed" });
    } finally {
      setNewMessageContent("");
      setTimeout(() => scrollToBottom("smooth"), 100);
    }
  };

  // MARK: 监听滚动位置
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = scrollRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (!scrollContainer) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
      setShowScrollButton(!isNearBottom);
    };

    const scrollContainer = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (scrollContainer) {
      handleScroll();
      scrollContainer.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleScroll);

      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [messages]);

  // 获取本地数据库调试信息
  const getLocalDbDebugInfo =
    useCallback(async (): Promise<LocalDbDebugInfo> => {
      try {
        const allMessages = await localDb.messages.toArray();
        const chatMessages = await localDb.messages.where({ chatId }).toArray();

        return {
          totalMessages: allMessages.length,
          chatMessages: chatMessages.length,
          chatMessagesSample: chatMessages.slice(0, 3).map((m) => ({
            id: m.id || "unknown",
            senderId: m.senderId,
            content: m.content?.substring(0, 30) || "",
            createdAt: m.createdAt,
          })),
          allChats: [...new Set(allMessages.map((m) => m.chatId))],
        };
      } catch (error) {
        console.error("Error getting local DB debug info:", error);
        return {
          totalMessages: 0,
          chatMessages: 0,
          chatMessagesSample: [],
          allChats: [],
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }, [localDb, chatId]);

  // 定期更新调试信息
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const updateDebugInfo = async () => {
        const info = await getLocalDbDebugInfo();
        setLocalDbDebugInfo(info);
      };

      updateDebugInfo();
      const interval = setInterval(updateDebugInfo, 2000);
      return () => clearInterval(interval);
    }
  }, [getLocalDbDebugInfo]);

  // 手动刷新消息函数 - 修复版本
  const manualRefreshMessages = useCallback(async () => {
    if (isManualRefreshing) return;

    console.log("🔄 Manual refresh triggered");
    setIsManualRefreshing(true);
    setIsMessagesSynced(false);

    try {
      // 1. 清空本地消息
      await localDb.messages.where({ chatId }).delete();
      console.log("✅ Cleared local messages");

      // 2. 重置状态
      setSenderUserMap(new Map());
      userCacheRef.current.clear();
      setUserCache(new Map());

      // 3. 强制重新获取API数据
      await refetchMessages();
      console.log("✅ Refetched API messages");

      // 4. 触发重新同步
      setTimeout(() => {
        setIsMessagesSynced(false);
        setIsManualRefreshing(false);
        console.log("✅ Manual refresh completed");
      }, 1000);
    } catch (error) {
      console.error("❌ Error during manual refresh:", error);
      setIsManualRefreshing(false);
    }
  }, [chatId, localDb, isManualRefreshing, refetchMessages]);

  const messageList = () => {
    // 详细的调试信息
    const debugInfo = {
      messagesCount: messages?.length || 0,
      apiMessagesCount: apiMessages?.length || 0,
      isMessagesSynced,
      userCacheSize: userCache.size,
      senderUserMapSize: senderUserMap.size,
      currentUserId,
      chatId,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
    };

    if (!messages || messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-muted-foreground">
          <p className="text-lg font-medium">暂无消息</p>
          <p className="text-sm">来发送第一条消息吧！</p>

          {/* 详细调试信息 */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-xs text-black max-w-md">
              <h4 className="font-bold mb-2">调试信息</h4>
              <div className="space-y-1">
                <p>API消息数: {debugInfo.apiMessagesCount}</p>
                <p>本地消息数: {debugInfo.messagesCount}</p>
                <p>
                  同步状态: {debugInfo.isMessagesSynced ? "已同步" : "未同步"}
                </p>
                <p>用户缓存: {debugInfo.userCacheSize}</p>
                <p>发送者映射: {debugInfo.senderUserMapSize}</p>
                <p>当前用户ID: {debugInfo.currentUserId || "未设置"}</p>
                <p>聊天ID: {debugInfo.chatId}</p>
                <p>会话状态: {debugInfo.hasSession ? "已登录" : "未登录"}</p>
                <p>访问令牌: {debugInfo.hasAccessToken ? "有效" : "无效"}</p>
              </div>

              {/* 本地数据库调试信息 */}
              {localDbDebugInfo && (
                <div className="mt-2 pt-2 border-t">
                  <p className="font-bold">本地数据库:</p>
                  <p>总消息数: {localDbDebugInfo.totalMessages}</p>
                  <p>当前聊天消息数: {localDbDebugInfo.chatMessages}</p>
                  <p>聊天室数: {localDbDebugInfo.allChats.length}</p>
                  {localDbDebugInfo.error && (
                    <p className="text-red-600">
                      错误: {localDbDebugInfo.error}
                    </p>
                  )}
                  {localDbDebugInfo.chatMessagesSample.length > 0 && (
                    <div className="mt-1">
                      <p className="font-bold">消息样例:</p>
                      {localDbDebugInfo.chatMessagesSample.map((msg, i) => (
                        <p key={i} className="text-xs">
                          {i + 1}. {msg.content}... (ID:{" "}
                          {msg.id.substring(0, 8)})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 显示原始API数据 */}
              {apiMessages && apiMessages.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <p className="font-bold">API消息样例:</p>
                  <pre className="text-xs overflow-auto max-h-32 bg-white p-2 rounded">
                    {JSON.stringify(apiMessages[0], null, 2)}
                  </pre>
                </div>
              )}

              {/* Realtime状态提示 */}
              <div className="mt-2 pt-2 border-t">
                <p className="font-bold text-orange-600">⚠️ Realtime已禁用</p>
                <p className="text-xs">
                  由于权限问题，实时消息功能暂时禁用。
                  <br />
                  请使用手动刷新按钮获取新消息。
                  <br />
                  要启用实时功能，请在Supabase后台配置RLS策略。
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 确保消息按时间戳排序
    const sortedMessages = [...messages].sort(
      (a, b) => a.createdAt - b.createdAt
    );

    return (
      <div className="space-y-4 w-full p-4 pb-6">
        {/* 简化的调试信息 */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-muted-foreground bg-yellow-100 p-2 rounded border">
            <div className="grid grid-cols-2 gap-2">
              <span>API: {debugInfo.apiMessagesCount}</span>
              <span>本地: {debugInfo.messagesCount}</span>
              <span>同步: {debugInfo.isMessagesSynced ? "✅" : "❌"}</span>
              <span>用户ID: {debugInfo.currentUserId ? "✅" : "❌"}</span>
            </div>
          </div>
        )}

        {sortedMessages.map((message) => {
          // 从发送者用户映射中获取用户信息
          const senderUserInfo = senderUserMap.get(message.senderId);

          return (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-2 w-full",
                message.senderId === currentUserId
                  ? "justify-end"
                  : "justify-start"
              )}
            >
              {message.senderId !== currentUserId && (
                <Avatar>
                  <AvatarImage
                    src={
                      senderUserInfo?.avatarUrl ||
                      `https://avatar.vercel.sh/${message.senderName}`
                    }
                  />
                  <AvatarFallback>
                    {(senderUserInfo?.name ||
                      message.senderName)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "flex flex-col max-w-[70%]",
                  message.senderId === currentUserId
                    ? "items-end"
                    : "items-start"
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2 mb-1",
                    message.senderId === currentUserId
                      ? "flex-row-reverse"
                      : "flex-row"
                  )}
                >
                  <span className="text-sm font-medium">
                    {message.senderId === currentUserId
                      ? "我"
                      : senderUserInfo?.name || message.senderName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(message.createdAt, {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </span>
                </div>
                <ContextMenu>
                  <ContextMenuTrigger>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2 break-words",
                        "max-w-full w-fit shadow-sm",
                        message.senderId === currentUserId
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md",
                        message.status === "sending" && "opacity-70",
                        message.status === "failed" && "bg-red-500 text-white"
                      )}
                    >
                      {message.content}
                      {message.status === "sending" && (
                        <span className="ml-2 text-xs">发送中...</span>
                      )}
                      {message.status === "failed" && (
                        <span className="ml-2 text-xs">发送失败</span>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem>复制消息</ContextMenuItem>
                    <ContextMenuItem>回复</ContextMenuItem>
                    {message.senderId === currentUserId && (
                      <>
                        <ContextMenuItem>编辑</ContextMenuItem>
                        <ContextMenuItem className="text-red-600">
                          删除
                        </ContextMenuItem>
                      </>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              </div>

              {message.senderId === currentUserId && (
                <Avatar>
                  <AvatarImage
                    src={
                      user?.user_metadata?.avatar_url ||
                      `https://avatar.vercel.sh/${message.senderName}`
                    }
                  />
                  <AvatarFallback>
                    {(user?.user_metadata?.name ||
                      message.senderName)[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>请先登录后参与聊天</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background relative">
      {/* 聊天头部 */}
      <div className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={`https://avatar.vercel.sh/${chatName}`} />
            <AvatarFallback>{chatName[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{chatName}</h2>
            <p className="text-xs text-muted-foreground">
              {type === "group" ? "群聊" : "私聊"}
            </p>
          </div>
        </div>

        {/* 调试控制按钮 */}
        {process.env.NODE_ENV === "development" && (
          <div className="flex items-center gap-2">
            <div className="flex gap-2 mt-2">
              <button
                onClick={manualRefreshMessages}
                disabled={isManualRefreshing}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
              >
                {isManualRefreshing ? "🔄 刷新中..." : "🔄 手动刷新"}
              </button>
              <button
                onClick={() => {
                  setIsMessagesSynced(false);
                  console.log("🔧 Forcing resync...");
                }}
                className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
              >
                🔧 强制重新同步
              </button>
            </div>

            <Button
              onClick={async () => {
                console.log("🩺 Running Realtime diagnostics...");

                // 测试不同的表名
                const testTables = ["messages", "message", "chat_messages"];

                for (const tableName of testTables) {
                  console.log(`🧪 Testing table: ${tableName}`);
                  const diagChannel = supabase
                    .channel(`diag-${tableName}-${Date.now()}`)
                    .on(
                      "postgres_changes",
                      {
                        event: "*",
                        schema: "public",
                        table: tableName,
                      },
                      (payload) => {
                        console.log(
                          `✅ ${tableName} subscription works:`,
                          payload
                        );
                      }
                    )
                    .subscribe((status) => {
                      console.log(`📊 ${tableName} status:`, status);
                      // 清理
                      setTimeout(
                        () => supabase.removeChannel(diagChannel),
                        3000
                      );
                    });
                }

                // 测试认证
                const { data: session } = await supabase.auth.getSession();
                console.log(
                  "🔐 Current session:",
                  session ? "✅ Valid" : "❌ Invalid"
                );

                // 测试数据库连接
                try {
                  const { error } = await supabase
                    .from("messages")
                    .select("id")
                    .limit(1);
                  if (error) {
                    console.log("❌ Database query error:", error.message);
                  } else {
                    console.log("✅ Database query successful");
                  }
                } catch (err) {
                  console.log("❌ Database connection failed:", err);
                }
              }}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              🩺 诊断Realtime
            </Button>
          </div>
        )}
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea ref={scrollRef} className="h-full">
          {messageList()}
        </ScrollArea>

        {/* 回到底部按钮 */}
        {showScrollButton && (
          <Button
            onClick={() => scrollToBottom("smooth")}
            className={cn(
              "absolute bottom-4 right-4 rounded-full p-3",
              "shadow-lg hover:shadow-xl transition-all duration-200 z-10",
              "bg-primary/90 hover:bg-primary text-primary-foreground",
              "backdrop-blur-sm hover:scale-105"
            )}
            size="icon"
            aria-label="滚动到底部"
            type="button"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 输入区域 */}
      <MessageInput
        newMessage={newMessageContent}
        setNewMessage={setNewMessageContent}
        onHandleSend={() => handleSend(newMessageContent)}
      />
    </div>
  );
}

// 导出 ApiMessage 类型以供其他地方使用
export type { ApiMessage };
