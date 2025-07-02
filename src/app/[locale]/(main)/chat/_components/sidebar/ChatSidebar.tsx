"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Users, Hash, Plus, Mic, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ServerChannel } from "../server/server-channel";
import { UserListItem } from "../common/UserListItem";
import {
  FIXED_CHANNELS,
  MOCK_RECENT_USERS,
  PUBLIC_CHANNEL,
} from "../common/ChatConstants";
import { ChannelType } from "@/types/convex/channel";
import { Id } from "@/convex/_generated/dataModel";
import Link from "next/link";

interface ChatSidebarProps {
  className?: string;
}

export const ChatSidebar = React.memo(({ className }: ChatSidebarProps) => {
  const handleUserClick = React.useCallback((username: string) => {
    console.log("点击用户:", username);
    // TODO: 实现私聊功能
  }, []);

  const handleAddChannel = React.useCallback(() => {
    console.log("添加频道");
    // TODO: 实现添加频道功能
  }, []);

  const handleAddUser = React.useCallback(() => {
    console.log("添加用户");
    // TODO: 实现添加用户功能
  }, []);

  return (
    <Card
      className={cn(
        "hidden md:flex flex-col w-60 rounded-none",
        "dark:bg-zinc-900 bg-zinc-50 select-none",
        "pt-0",
        className
      )}
    >
      {/* 头部 */}
      <div className="p-3 h-14 flex items-center border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="font-semibold text-lg">Channels</h2>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="mt-2">
          {/* 文字频道部分 */}
          <div className="flex items-center justify-between py-2">
            <span className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
              文字频道
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={handleAddChannel}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* 公共频道 */}
          <Link href="/chat">
            <ServerChannel
              channel={PUBLIC_CHANNEL}
              icon={Hash}
              isOfficial={true}
              isPrivate={false}
              isGroup={false}
              isPublic={true}
            />
          </Link>

          {/* 其他频道 */}
          {FIXED_CHANNELS.map((channel) => (
            <ServerChannel
              key={channel._id}
              channel={{
                _id: channel._id as Id<"channels">,
                name: channel.name,
                type: channel.type as ChannelType,
                isOfficial: true,
                createdAt: Date.now(),
              }}
              icon={
                channel.type === "text"
                  ? Hash
                  : channel.type === "voice"
                  ? Mic
                  : Video
              }
              isOfficial={true}
              isPrivate={false}
              isGroup={false}
              isPublic={true}
            />
          ))}
        </div>

        <Separator className="my-2 bg-zinc-200 dark:bg-zinc-700" />

        {/* 最近聊天部分 */}
        <div className="mt-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
              Recent chats
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={handleAddUser}
            >
              <Users className="h-4 w-4" />
            </Button>
          </div>

          {/* 用户列表 */}
          {MOCK_RECENT_USERS.map((user) => (
            <UserListItem
              key={user.id}
              username={user.username}
              avatarUrl={user.avatarUrl}
              isOnline={user.isOnline}
              onClick={() => handleUserClick(user.username)}
            />
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
});

ChatSidebar.displayName = "ChatSidebar";
