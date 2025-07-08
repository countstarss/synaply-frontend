"use client";

import React, { useEffect } from "react";
import { useChatStore } from "@/stores/chat";
import { usePathname, useSearchParams } from "next/navigation"; // 增加useSearchParams
import ContextMenuWrapper from "@/components/ContextMenuWrapper";
import { Card } from "@/components/ui/card";
import { ChatSidebar } from "@/app/[locale]/(main)/chat/_components/sidebar/ChatSidebar";
import { UserListItem } from "@/app/[locale]/(main)/chat/_components/common/UserListItem";
import { MOCK_RECENT_USERS } from "@/app/[locale]/(main)/chat/_components/common/ChatConstants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DialogTitle } from "@/components/ui/dialog";
import { ChatRoom } from "@/app/[locale]/(main)/chat/_components/chat/chat-room";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/context/AuthContext";

// MARK: 移动端侧边栏
const MobileSidebar = React.memo(() => {
  const { sidebarOpen, setSidebarOpen } = useChatStore();

  const handleUserClick = React.useCallback(
    (username: string) => {
      console.log("移动端点击用户:", username);
      setSidebarOpen(false);
    },
    [setSidebarOpen]
  );

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Users className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 w-60">
        <DialogTitle>
          <p className="sr-only">Chat Square</p>
        </DialogTitle>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Recent Chats</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
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
        </div>
      </SheetContent>
    </Sheet>
  );
});

MobileSidebar.displayName = "MobileSidebar";

// MARK: 顶部栏
const ChatTopBar = React.memo(() => {
  const { toggleSidebar } = useChatStore();

  return (
    <div className="h-16 border-b flex items-center p-4 justify-between">
      <div className="flex items-center gap-2">
        <h1 className="font-semibold">Chat Square</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleSidebar}
        >
          <Users className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
});

ChatTopBar.displayName = "ChatTopBar";

// MARK: 聊天内容组件
const ChatContent = React.memo(() => {
  const { currentChannelId, setCurrentChannel } = useChatStore();
  const { session } = useAuth();
  const searchParams = useSearchParams();

  // 从URL参数中获取channelId
  const channelIdFromUrl = searchParams.get("channelId");

  // 当URL参数变化时更新当前频道
  useEffect(() => {
    if (channelIdFromUrl) {
      setCurrentChannel(channelIdFromUrl);
    }
  }, [channelIdFromUrl, setCurrentChannel]);

  // 获取用户的频道列表
  const channels = useQuery(
    api.channels.getUserChannels,
    session?.user?.id ? { userId: session.user.id } : "skip"
  );

  // 如果没有有效的频道ID，尝试使用第一个可用频道
  const validChannelId =
    currentChannelId && currentChannelId !== "public"
      ? currentChannelId
      : channels?.[0]?._id;

  const currentChannel = channels?.find(
    (ch) => ch && ch._id === validChannelId
  );

  // 如果正在加载频道列表，显示加载状态
  if (channels === undefined) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载频道中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 如果没有找到有效的频道，显示空状态
  if (!validChannelId || !currentChannel) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">暂无可用频道</h3>
            <p className="text-muted-foreground">
              请创建或加入一个频道开始聊天
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 转换为 Channel 类型，添加缺失的属性
  const channelForComponent = {
    ...currentChannel,
    type: currentChannel.chatType as "text" | "voice" | "video",
    isOfficial:
      currentChannel.isDefault || currentChannel.type === "team_public",
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatRoom
        channelId={validChannelId as Id<"channels">}
        channel={channelForComponent}
      />
    </div>
  );
});

ChatContent.displayName = "ChatContent";

// MARK: 全局Chat组件
// NOTE: 管理显示状态和缓存
interface GlobalChatProps {
  initialChannelId?: string | null;
}

export const GlobalChat = React.memo(
  ({ initialChannelId }: GlobalChatProps) => {
    const {
      isVisible,
      showChat,
      hideChat,
      initializeChat,
      isInitialized,
      setCurrentChannel,
    } = useChatStore();
    const pathname = usePathname();

    // 当initialChannelId变化时更新当前频道
    useEffect(() => {
      if (initialChannelId) {
        console.log("GlobalChat - 设置初始频道ID:", initialChannelId);
        setCurrentChannel(initialChannelId);
      }
    }, [initialChannelId, setCurrentChannel]);

    // 根据路径控制Chat显示/隐藏
    useEffect(() => {
      const isChatRoute = pathname.includes("/chat");

      if (isChatRoute) {
        showChat();
      } else {
        hideChat();
      }
    }, [pathname, showChat, hideChat]);

    // 预初始化Chat（在后台加载基础组件）
    useEffect(() => {
      if (!isInitialized) {
        // 延迟初始化，避免阻塞主要内容
        const timer = setTimeout(() => {
          initializeChat();
        }, 1000);

        return () => clearTimeout(timer);
      }
    }, [isInitialized, initializeChat]);

    // 如果还没有初始化且不可见，则不渲染
    if (!isInitialized && !isVisible) {
      return null;
    }

    return (
      <ContextMenuWrapper>
        {/* 适配原layout结构内的Chat布局 */}
        <div className="h-full flex w-full overflow-hidden">
          {/* 桌面端侧边栏 */}
          <ChatSidebar />

          {/* 主要内容区域 */}
          <Card className="flex-1 flex flex-col rounded-none pt-0">
            {/* 顶部栏 */}
            <ChatTopBar />

            {/* 移动端侧边栏 */}
            <MobileSidebar />

            {/* 聊天内容区域 */}
            <ChatContent />
          </Card>
        </div>
      </ContextMenuWrapper>
    );
  }
);

GlobalChat.displayName = "GlobalChat";
