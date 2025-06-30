"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, Hash, Plus, Mic, Video } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ServerChannel } from "./_components/server/server-channel";
import { Channel, ChannelType } from "@/types/convex/channel";
import { Id } from "@/convex/_generated/dataModel";
import ContextMenuWrapper from "@/components/ContextMenuWrapper";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/Spinner";

interface LayoutProps {
  // You can define any props needed here
  children: React.ReactNode;
}

// MARK: 固定频道
const channels: Channel[] = [
  // { id: "1", name: "general", type: "text" },
  // { id: "2", name: "voice-chat", type: "voice" },
  // { id: "jn78ja859vfcyn3h11gdnpbk2s771f5w", name: "meeting-room", type: "video" },
];

const Layout = ({ children }: LayoutProps) => {
  const { session } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Spinner />
      </div>
    );
  }

  return (
    <ContextMenuWrapper>
      <div className="h-screen flex w-full overflow-hidden">
        {/* 
        MARK: 用户列表侧边栏
        */}
        <Card className={cn(
          "hidden md:flex flex-col w-60 border-r rounded-none",
          "dark:bg-zinc-900 bg-zinc-50 select-none"
        )}>
          <div className="p-3 h-14 flex items-center border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="font-semibold text-lg">Channels</h2>
          </div>
          <ScrollArea className="flex-1 px-3">
            <div className="mt-2">
              <div className="flex items-center justify-between py-2">
                <span className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                  文字频道
                </span>
                <Button variant="ghost" size="icon" className="h-4 w-4">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Link href="/chat">
                <ServerChannel
                  key={"/"}
                  channel={{
                    _id: "/" as Id<"channels">,
                    name: "Public",
                    type: "text",
                    isOfficial: true,
                    createdAt: Date.now(),
                  }}
                  icon={Hash}
                  isOfficial={true}
                  isPrivate={false}
                  isGroup={false}
                  isPublic={true}
                />
              </Link>
              {channels.map((channel) => (
                <ServerChannel
                  key={channel._id}
                  channel={{
                    _id: channel._id as Id<"channels">,
                    name: channel.name,
                    type: channel.type as ChannelType,
                    isOfficial: true,
                    createdAt: Date.now(),
                  }}
                  icon={channel.type === "text" ? Hash : channel.type === "voice" ? Mic : Video}
                  isOfficial={true}
                  isPrivate={false}
                  isGroup={false}
                  isPublic={true}
                />
              ))}
            </div>
            <Separator className="my-2 bg-zinc-200 dark:bg-zinc-700" />
            <div className="mt-2">
              <div className="flex items-center justify-between py-2">
                <span className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                  Recent chats
                </span>
                <Button variant="ghost" size="icon" className="h-4 w-4">
                  <Users className="h-4 w-4" />
                </Button>
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={`recent-chat-${i}`}
                  className={cn(
                    "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full",
                    "hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1"
                  )}
                  type="button"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://avatar.vercel.sh/${i}`} />
                    <AvatarFallback>U{i}</AvatarFallback>
                  </Avatar>
                  <p className="line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition">
                    用户 {i + 1}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* 
        MARK: -   侧边栏移动端
        */}
        <Card className="flex-1 flex flex-col rounded-none">
          {/* 顶部栏 */}
          <div className="h-14 border-b flex items-center p-4 justify-between">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">Chat Square</h1>
            </div>
            <div className="flex items-center gap-2">
              <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                  <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Users className="h-6 w-6" />
                  </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="p-0 w-60">
                    <DialogTitle>
                      <p className="sr-only">Chat Square</p>
                    </DialogTitle>
                    <div
                      className="flex flex-col h-full"
                    // MARK: -Mobile Channel 
                    >
                      <div className="mt-6">
                        <div className="flex items-center justify-between p-4 border-b">
                          <h2 className="font-semibold">Channels</h2>
                        </div>
                        <div className='p-2'>
                          <Link href="/chat"
                            onClick={() => setIsSidebarOpen(false)}
                          >
                            <ServerChannel
                              key={"/"}
                              channel={{
                                _id: "/" as Id<"channels">,
                                name: "Public",
                                type: "text",
                                isOfficial: true,
                                createdAt: Date.now(),
                              }}
                              icon={Hash}
                              isOfficial={true}
                              isPrivate={false}
                              isGroup={false}
                              isPublic={true}
                            />
                          </Link>
                          {channels.map((channel) => (
                            <button
                              key={channel._id}
                              type="button"
                              onClick={() => setIsSidebarOpen(false)}
                            >
                              <ServerChannel
                                key={channel._id}
                                channel={{
                                  _id: channel._id as Id<"channels">,
                                  name: channel.name,
                                  type: channel.type as ChannelType,
                                  isOfficial: true,
                                  createdAt: Date.now(),
                                }}
                                icon={channel.type === "text" ? Hash : channel.type === "voice" ? Mic : Video}
                                isOfficial={true}
                                isPrivate={false}
                                isGroup={false}
                                isPublic={true}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 border-b">
                        <h2 className="font-semibold">Recent Chats</h2>
                      </div>
                      <ScrollArea className="flex-1"
                      // MARK: -Mobile Chats
                      >
                        <div className="p-2 space-y-2">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent"
                              onClick={() => setIsSidebarOpen(false)}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={`https://avatar.vercel.sh/${i}`} />
                                <AvatarFallback>U{i}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">用户 {i + 1}</span>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* 内容区域 - 移除AppTransition包装 */}
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </Card>
          
      </div>
    </ContextMenuWrapper>
  );
};

export default Layout;