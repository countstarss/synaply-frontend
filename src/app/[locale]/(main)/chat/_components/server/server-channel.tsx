"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";
import { Channel } from "@/types/convex/channel";

interface ServerChannelProps {
  channel: Channel;
  icon: LucideIcon;
  isOfficial: boolean;
  isPrivate: boolean;
  isGroup: boolean;
  isPublic: boolean;
}

export const ServerChannel = React.memo(
  ({ channel, icon: Icon }: ServerChannelProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const isActive = pathname?.includes(channel._id && channel._id.toString());

    const handleClick = React.useCallback(() => {
      router.push(`/chat/channels/${channel._id}`);
    }, [router, channel._id]);

    return (
      <button
        onClick={handleClick}
        className={cn(
          "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full",
          "hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1",
          isActive && "bg-zinc-700/20 dark:bg-zinc-700/50"
        )}
        type="button"
      >
        <Icon className="flex-shrink-0 w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        <p
          className={cn(
            "line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600",
            "dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
            isActive && "text-zinc-600 dark:text-zinc-300"
          )}
        >
          {channel.name}
        </p>
      </button>
    );
  }
);

ServerChannel.displayName = "ServerChannel";
