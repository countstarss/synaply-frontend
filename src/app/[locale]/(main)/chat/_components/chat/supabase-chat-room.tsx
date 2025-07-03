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
// import { ChatHeader } from "./chat-header";
import { Button } from "@/components/ui/button";
import { ChevronDown, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClientComponentClient } from "@/lib/supabase";
import { useLiveQuery } from "dexie-react-hooks";
import { LocalChatMessage } from "@/lib/local-db";
import { useLocalDb } from "@/providers/local-db-provider"; // 导入 useLocalDb 和 LocalChatMessage
import { v4 as uuidv4 } from "uuid"; // 用于生成本地消息ID

// 消息类型定义
interface Message extends LocalChatMessage {
  // Supabase 消息可能包含的额外字段
  id: string; // Supabase 消息的实际ID
}

interface SupabaseChatRoomProps {
  chatId: string; // 对应 Supabase 的 chat_id
  type: "private" | "group"; // 聊天类型
  chatName: string; // 聊天名称 (群聊名称或私聊对方名称)
}

export function SupabaseChatRoom({
  chatId,
}: // type,
// chatName,
SupabaseChatRoomProps) {
  const { session } = useAuth();
  const supabase = createClientComponentClient();
  const localDb = useLocalDb(); // 获取本地数据库实例

  const [newMessageContent, setNewMessageContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 从本地数据库实时查询消息
  const messages = useLiveQuery(
    () => localDb.messages.where({ chatId }).sortBy("createdAt"),
    [chatId, localDb]
  ) as Message[] | undefined;

  // MARK: 初始加载 Supabase 历史消息并存入本地
  useEffect(() => {
    const fetchAndCacheMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching Supabase messages:", error);
          return;
        }

        if (data) {
          const localMessages: LocalChatMessage[] = data.map((msg) => ({
            id: msg.id,
            chatId: msg.chat_id,
            senderId: msg.sender_id,
            senderName: msg.sender_name || "Unknown", // 假设 Supabase 消息有 sender_name
            content: msg.content,
            createdAt: new Date(msg.created_at).getTime(),
            type: msg.type || "text", // 假设 Supabase 消息有 type
            status: "sent",
          }));
          // 清除旧的本地消息，然后批量添加新的
          await localDb.messages.where({ chatId }).delete();
          await localDb.messages.bulkAdd(localMessages);
        }
      } catch (error) {
        console.error("Error in fetchAndCacheMessages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndCacheMessages();
  }, [chatId, supabase, localDb]);

  interface SupabaseMessage {
    id: string;
    chat_id: string;
    sender_id: string;
    sender_name?: string; // 假设 Supabase 消息有 sender_name
    content: string;
    created_at: string; // Supabase 返回的是 ISO 格式的字符串
    type?: "text" | "image" | "file"; // 假设 Supabase 消息有 type
    // ... 其他 Supabase 消息字段
  }

  // MARK: Supabase Realtime 订阅
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // 监听所有事件 (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          const newSupabaseMessage = payload.new as SupabaseMessage; // payload.new 包含新数据
          const oldSupabaseMessage = payload.old as SupabaseMessage; // payload.old 包含旧数据 (for UPDATE/DELETE)

          if (payload.eventType === "INSERT") {
            const localMessage: LocalChatMessage = {
              id: newSupabaseMessage.id,
              chatId: newSupabaseMessage.chat_id,
              senderId: newSupabaseMessage.sender_id,
              senderName: newSupabaseMessage.sender_name || "Unknown",
              content: newSupabaseMessage.content,
              createdAt: new Date(newSupabaseMessage.created_at).getTime(),
              type: newSupabaseMessage.type || "text",
              status: "sent",
            };
            // 检查消息是否已存在（乐观更新的消息可能已经存在）
            const existingMessage = await localDb.messages.get(
              localMessage.id!
            );
            if (!existingMessage) {
              await localDb.messages.add(localMessage);
            } else {
              // 如果存在，更新其状态为 'sent'
              await localDb.messages.update(localMessage.id!, {
                status: "sent",
              });
            }
          } else if (payload.eventType === "UPDATE") {
            // 处理消息更新 (例如，状态更新)
            const updatedLocalMessage: Partial<LocalChatMessage> = {
              status: "sent", // 假设更新意味着消息已成功处理
              content: newSupabaseMessage.content, // 更新内容
              // ... 其他需要更新的字段
            };
            await localDb.messages.update(
              newSupabaseMessage.id,
              updatedLocalMessage
            );
          } else if (payload.eventType === "DELETE") {
            // 处理消息删除 (如果 Supabase 允许删除)
            await localDb.messages.delete(oldSupabaseMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, supabase, localDb]);

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

  // MARK: 平滑滚动
  useEffect(() => {
    if (messages && messages.length > 0) {
      scrollToBottom("smooth");
    }
  }, [messages, scrollToBottom]);

  // MARK: handleSend
  const handleSend = async (content: string) => {
    if (!session || !content.trim()) return;

    const tempMessageId = uuidv4(); // 生成一个临时ID用于乐观更新

    // 乐观更新本地消息列表
    const optimisticMessage: LocalChatMessage = {
      id: tempMessageId,
      chatId: chatId,
      senderId: session.user?.id || "",
      senderName:
        session.user?.user_metadata.name ||
        session.user?.email?.split("@")[0] ||
        "Anonymous",
      content: content,
      createdAt: Date.now(),
      type: "text", // 默认为文本消息
      status: "sending", // 标记为发送中
    };

    try {
      await localDb.messages.add(optimisticMessage);

      const { data, error } = await supabase
        .from("messages")
        .insert({
          chat_id: chatId,
          sender_id: session.user?.id || "",
          sender_name:
            session.user?.user_metadata.name ||
            session.user?.email?.split("@")[0] ||
            "Anonymous",
          content: content,
          type: "text",
        })
        .select(); // select() 返回插入的数据，包含 Supabase 生成的 ID

      if (error) {
        console.error("Error sending message to Supabase:", error);
        // 更新本地消息状态为失败
        await localDb.messages.update(tempMessageId, { status: "failed" });
      } else if (data && data.length > 0) {
        // 消息发送成功，更新本地消息的 ID 和状态
        const sentMessage = data[0];
        await localDb.messages.update(tempMessageId, {
          id: sentMessage.id, // 更新为 Supabase 生成的实际 ID
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
  }, [messages]); // 依赖 messages 变化

  const messageList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">加载消息...</span>
          </div>
        </div>
      );
    }

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
              message.senderId === session?.user?.id
                ? "justify-end"
                : "justify-start"
            )}
          >
            {message.senderId !== session?.user?.id && (
              <Avatar>
                <AvatarImage
                  src={`https://avatar.vercel.sh/${message.senderName}`}
                />
                <AvatarFallback>
                  {message.senderName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                "flex flex-col max-w-[70%]",
                message.senderId === session?.user?.id
                  ? "items-end"
                  : "items-start"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2 mb-1",
                  message.senderId === session?.user?.id
                    ? "flex-row-reverse"
                    : "flex-row"
                )}
              >
                <span className="text-sm font-medium">
                  {message.senderName}
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
                      message.senderId === session?.user?.id
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md",
                      message.status === "sending" && "opacity-70", // 发送中消息半透明
                      message.status === "failed" && "bg-red-500 text-white" // 发送失败消息红色
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
                  <ContextMenuItem>个人资料</ContextMenuItem>
                  <ContextMenuItem>复制消息</ContextMenuItem>
                  <ContextMenuItem>举报</ContextMenuItem>
                  {message.senderId === session?.user?.id && (
                    <ContextMenuItem
                      onClick={() => {
                        /* TODO: 实现本地删除 */
                      }}
                    >
                      本地删除
                    </ContextMenuItem>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            </div>

            {message.senderId === session?.user?.id && (
              <Avatar>
                <AvatarImage
                  src={`https://avatar.vercel.sh/${message.senderName}`}
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
      {/* <ChatHeader title={chatName} channel={chatId} /> */}

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
