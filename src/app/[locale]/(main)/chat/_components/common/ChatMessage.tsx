"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { OptimizedAvatar } from "./OptimizedAvatar";

interface ChatMessageProps {
  id: string;
  content: string;
  userName: string;
  userAvatar?: string;
  createdAt: number;
  isOwnMessage: boolean;
  className?: string;
}

export const ChatMessage = React.memo(
  ({
    id,
    content,
    userName,
    userAvatar,
    createdAt,
    isOwnMessage,
    className,
  }: ChatMessageProps) => {
    const handleContextMenuAction = React.useCallback(
      (action: string) => {
        console.log(`执行操作: ${action} 在消息: ${id}`);
        // TODO: 实现具体的上下文菜单操作
      },
      [id]
    );

    const formattedTime = React.useMemo(() => {
      return formatDistanceToNow(createdAt, {
        addSuffix: true,
        locale: zhCN,
      });
    }, [createdAt]);

    const userInitial = React.useMemo(() => {
      return userName[0]?.toUpperCase() || "U";
    }, [userName]);

    return (
      <div
        className={cn(
          "flex items-start gap-2 w-full",
          isOwnMessage ? "justify-end" : "justify-start",
          className
        )}
      >
        {/* 其他用户的头像（左侧） */}
        {!isOwnMessage && (
          <OptimizedAvatar src={userAvatar} fallback={userInitial} size="md" />
        )}

        {/* 消息内容 */}
        <div
          className={cn(
            "flex flex-col max-w-[70%]",
            isOwnMessage ? "items-end" : "items-start"
          )}
        >
          {/* 用户名和时间 */}
          <div
            className={cn(
              "flex items-center gap-2 mb-1",
              isOwnMessage ? "flex-row-reverse" : "flex-row"
            )}
          >
            <span className="text-sm font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground">
              {formattedTime}
            </span>
          </div>

          {/* 消息气泡 */}
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className={cn(
                  "rounded-2xl px-4 py-2 break-words",
                  "max-w-full w-fit shadow-sm transition-colors",
                  isOwnMessage
                    ? "bg-primary text-primary-foreground rounded-br-md hover:bg-primary/90"
                    : "bg-muted rounded-bl-md hover:bg-muted/80"
                )}
              >
                {content}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem
                onClick={() => handleContextMenuAction("profile")}
              >
                个人资料
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleContextMenuAction("copy")}>
                复制消息
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => handleContextMenuAction("report")}
              >
                举报
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>

        {/* 自己的头像（右侧） */}
        {isOwnMessage && (
          <OptimizedAvatar src={userAvatar} fallback={userInitial} size="md" />
        )}
      </div>
    );
  }
);

ChatMessage.displayName = "ChatMessage";
