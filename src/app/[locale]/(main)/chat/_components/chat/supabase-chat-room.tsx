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

// API响应类型
interface ApiMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  type?: string;
  sender?: {
    id: string;
    user?: {
      name?: string;
      avatar_url?: string;
    };
  };
}

interface RealtimeMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  type?: string;
}

interface TeamMemberResponse {
  id: string;
  user?: {
    name?: string;
    avatar_url?: string;
  };
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

  // 获取当前用户的团队成员ID
  useEffect(() => {
    const getCurrentUserId = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_DEV_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${session?.access_token}`,
            },
          }
        );

        if (response.ok) {
          const userData = await response.json();
          setCurrentUserId(userData.teamMemberId);
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

  // MARK: 初始加载历史消息
  useEffect(() => {
    const fetchAndCacheMessages = async () => {
      if (!currentUserId) return;

      // setIsLoading(true);
      try {
        const response = await fetch(`/api/chats/${chatId}/messages`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          console.error("Error fetching messages:", response.statusText);
          return;
        }

        const data = await response.json();

        if (data && Array.isArray(data)) {
          const localMessages: LocalChatMessage[] = data.map(
            (msg: ApiMessage) => ({
              id: msg.id,
              chatId: msg.chat_id,
              senderId: msg.sender_id,
              senderName: msg.sender?.user?.name || "Unknown User",
              content: msg.content,
              createdAt: new Date(msg.created_at).getTime(),
              type:
                msg.type === "TEXT" ||
                msg.type === "IMAGE" ||
                msg.type === "FILE"
                  ? (msg.type.toLowerCase() as "text" | "image" | "file")
                  : "text",
              status: "sent",
            })
          );

          // 清除旧的本地消息，然后批量添加新的
          await localDb.messages.where({ chatId }).delete();
          await localDb.messages.bulkAdd(localMessages);
        }
      } catch (error) {
        console.error("Error in fetchAndCacheMessages:", error);
      }
      // finally {
      //   setIsLoading(false);
      // }
    };

    fetchAndCacheMessages();
  }, [chatId, session?.access_token, localDb, currentUserId]);

  // MARK: Supabase Realtime 订阅
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          console.log("Realtime message event:", payload);

          if (payload.eventType === "INSERT") {
            const newMessage = payload.new as RealtimeMessage;

            const localMessage: LocalChatMessage = {
              id: newMessage.id,
              chatId: newMessage.chat_id,
              senderId: newMessage.sender_id,
              senderName: "Loading...", // 将通过API获取完整信息
              content: newMessage.content,
              createdAt: new Date(newMessage.created_at).getTime(),
              type:
                newMessage.type === "TEXT" ||
                newMessage.type === "IMAGE" ||
                newMessage.type === "FILE"
                  ? (newMessage.type.toLowerCase() as "text" | "image" | "file")
                  : "text",
              status: "sent",
            };

            // 检查消息是否已存在
            const existingMessage = await localDb.messages.get(
              localMessage.id!
            );
            if (!existingMessage) {
              await localDb.messages.add(localMessage);

              // 获取发送者信息
              try {
                const response = await fetch(
                  `/api/team-members/${newMessage.sender_id}`,
                  {
                    headers: {
                      Authorization: `Bearer ${session?.access_token}`,
                    },
                  }
                );

                if (response.ok) {
                  const senderData: TeamMemberResponse = await response.json();
                  await localDb.messages.update(localMessage.id!, {
                    senderName: senderData.user?.name || "Unknown User",
                  });
                }
              } catch (error) {
                console.error("Error fetching sender info:", error);
              }
            } else {
              await localDb.messages.update(localMessage.id!, {
                status: "sent",
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedMessage = payload.new as RealtimeMessage;
            await localDb.messages.update(updatedMessage.id, {
              content: updatedMessage.content,
              status: "sent",
            });
          } else if (payload.eventType === "DELETE") {
            const deletedMessage = payload.old as RealtimeMessage;
            await localDb.messages.delete(deletedMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, supabase, localDb, currentUserId, session?.access_token]);

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

      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          content: content,
          type: "TEXT",
        }),
      });

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

  const messageList = () => {
    if (!messages || messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-muted-foreground">
          <p className="text-lg font-medium">暂无消息</p>
          <p className="text-sm">来发送第一条消息吧！</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 w-full p-4 pb-6">
        {messages.map((message) => (
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
                    message.sender?.user?.avatar_url ||
                    `https://avatar.vercel.sh/${message.senderName}`
                  }
                />
                <AvatarFallback>
                  {message.senderName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                "flex flex-col max-w-[70%]",
                message.senderId === currentUserId ? "items-end" : "items-start"
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
                    : message.senderName}
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
                  {message.senderName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
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
      <div className="h-14 border-b flex items-center px-4">
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
