"use client";

import React, { useEffect } from "react";
import { useChatStore } from "@/stores/chat";
import { usePathname } from "next/navigation"; // 导入 usePathname
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
  const { currentChannelId } = useChatStore();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ChatRoom
        channelId={currentChannelId}
        type="public"
        // 传递一个简单的channel对象
        channel={{
          _id: currentChannelId as Id<"channels">,
          name: "Public",
          type: "text",
          isOfficial: true,
          createdAt: Date.now(),
        }}
      />
    </div>
  );
});

ChatContent.displayName = "ChatContent";

// MARK: 全局Chat组件
// NOTE: 管理显示状态和缓存
export const GlobalChat = React.memo(() => {
  const { isVisible, showChat, hideChat, initializeChat, isInitialized } =
    useChatStore();
  const pathname = usePathname();

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
});

GlobalChat.displayName = "GlobalChat";
