"use client";

import { Hash, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Channel } from "@/lib/types/convex/channel";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  title: string;
  channel: Channel;
  onMembersClick?: () => void;
  onSettingsClick?: () => void;
  className?: string;
}

export function ChatHeader({ 
  title,
  channel,
  onMembersClick,
  onSettingsClick,
  className
}: ChatHeaderProps) {
  return (
    <div className={cn(
      "text-md font-semibold px-3 flex items-center h-12 border-b dark:border-b-neutral-800 dark:bg-[#2B2D31] bg-white light:bg-white sticky top-0 z-10",
      className
    )}>
      <div className="flex items-center gap-2">
        <Hash className="w-5 h-5 text-zinc-400" />
        <div className="flex flex-col">
          <p className="font-semibold text-md">{title}</p>
          {channel.isOfficial && (
            <p className="text-xs text-zinc-400">Official Channel</p>
          )}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onMembersClick}
        >
          <Users className="h-5 w-5" />
        </Button>
        {!channel.isOfficial && channel.creatorId && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onSettingsClick}
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}