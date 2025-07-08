"use client";

import { Hash, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Channel } from "@/types/convex/channel";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  title: string;
  channel: Channel;
  onMembersClick?: () => void;
  onSettingsClick?: () => void;
  className?: string;
}

export function ChatHeader({
  // title,
  channel,
  onMembersClick,
  onSettingsClick,
  className,
}: ChatHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between h-16 px-6 border-b",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "border-border/50 shrink-0",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full",
            "bg-primary/10 text-primary"
          )}
        >
          <Hash className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          {/* <h1 className="font-semibold text-base leading-none">{title}</h1> */}
          {channel.isOfficial && (
            <p className="text-xs text-muted-foreground mt-1">官方频道</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMembersClick}
          className="h-9 w-9 rounded-full hover:bg-accent transition-colors"
        >
          <Users className="h-4 w-4" />
        </Button>
        {!channel.isOfficial && channel.creatorId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="h-9 w-9 rounded-full hover:bg-accent transition-colors"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
