"use client";

import React, { useState } from "react"; // 导入 useState
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Users,
  Hash,
  Plus,
  Mic,
  Video,
  MessageCircle,
  Group,
} from "lucide-react";
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
// import { useRouter } from "next/navigation";
import { CreateGroupChatModal } from "../modals/create-group-chat-modal"; // 导入 CreateGroupChatModal
import { StartPrivateChatModal } from "../modals/start-private-chat-modal"; // 导入 StartPrivateChatModal

interface ChatSidebarProps {
  className?: string;
}

export const ChatSidebar = React.memo(({ className }: ChatSidebarProps) => {
  // const router = useRouter();
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false); // 控制创建群聊模态框的显示
  const [isStartPrivateChatModalOpen, setIsStartPrivateChatModalOpen] =
    useState(false); // 控制私聊模态框的显示

  const handleUserClick = React.useCallback((username: string) => {
    console.log("点击用户:", username);
    // TODO: 实现私聊功能，跳转到 Supabase 私聊路由
    // router.push(`/chat/supabase/${privateChatId}`);
  }, []);

  const handleAddChannel = React.useCallback(() => {
    console.log("添加频道");
    // TODO: 实现添加 Convex 频道功能
  }, []);

  const handleAddSupabaseGroupChat = React.useCallback(() => {
    console.log("创建 Supabase 群聊");
    setIsCreateGroupModalOpen(true); // 打开创建群聊模态框
  }, []);

  const handleAddSupabasePrivateChat = React.useCallback(() => {
    console.log("发起 Supabase 私聊");
    setIsStartPrivateChatModalOpen(true); // 打开私聊模态框
  }, []);

  // 模拟 Supabase 聊天数据
  const MOCK_SUPABASE_GROUP_CHATS = [
    { id: "group-chat-1", name: "项目讨论组", type: "group" },
    { id: "group-chat-2", name: "前端开发组", type: "group" },
  ];

  const MOCK_SUPABASE_PRIVATE_CHATS = [
    { id: "private-chat-1", name: "张三", type: "private" },
    { id: "private-chat-2", name: "李四", type: "private" },
  ];

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
          {/* 文字频道部分 (Convex) */}
          <div className="flex items-center justify-between py-2">
            <span className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
              公共频道 (Convex)
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
          <Link href="/chat/public">
            <ServerChannel
              channel={PUBLIC_CHANNEL}
              icon={Hash}
              isOfficial={true}
              isPrivate={false}
              isGroup={false}
              isPublic={true}
            />
          </Link>

          {/* 其他 Convex 频道 */}
          {FIXED_CHANNELS.map((channel) => (
            <Link key={channel._id} href={`/chat/public/channels/${channel._id}`}>
              <ServerChannel
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
            </Link>
          ))}
        </div>

        <Separator className="my-2 bg-zinc-200 dark:bg-zinc-700" />

        {/* Supabase 群聊部分 */}
        <div className="mt-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
              群聊 (Supabase)
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={handleAddSupabaseGroupChat}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {MOCK_SUPABASE_GROUP_CHATS.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <ServerChannel
                channel={{
                  _id: chat.id as Id<"channels">, // 暂时使用 Convex 的 Id 类型，后续需要调整
                  name: chat.name,
                  type: "text", // 假设群聊是文本类型
                  isOfficial: false,
                  createdAt: Date.now(),
                }}
                icon={Group} // 群聊图标
                isOfficial={false}
                isPrivate={false}
                isGroup={true}
                isPublic={false}
              />
            </Link>
          ))}
        </div>

        <Separator className="my-2 bg-zinc-200 dark:bg-zinc-700" />

        {/* Supabase 私聊部分 */}
        <div className="mt-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
              私聊 (Supabase)
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={handleAddSupabasePrivateChat}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {MOCK_SUPABASE_PRIVATE_CHATS.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <ServerChannel
                channel={{
                  _id: chat.id as Id<"channels">, // 暂时使用 Convex 的 Id 类型，后续需要调整
                  name: chat.name,
                  type: "text", // 假设私聊是文本类型
                  isOfficial: false,
                  createdAt: Date.now(),
                }}
                icon={MessageCircle} // 私聊图标
                isOfficial={false}
                isPrivate={true}
                isGroup={false}
                isPublic={false}
              />
            </Link>
          ))}
        </div>

        <Separator className="my-2 bg-zinc-200 dark:bg-zinc-700" />

        {/* 最近聊天部分 (Convex) - 保持不变或根据需求调整 */}
        <div className="mt-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
              最近聊天 (Convex)
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              // onClick={handleAddUser} // 保持原有逻辑
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

      {/* 创建群聊模态框 */}
      <CreateGroupChatModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />

      {/* 开始私聊模态框 */}
      <StartPrivateChatModal
        isOpen={isStartPrivateChatModalOpen}
        onClose={() => setIsStartPrivateChatModalOpen(false)}
      />
    </Card>
  );
});

ChatSidebar.displayName = "ChatSidebar";
