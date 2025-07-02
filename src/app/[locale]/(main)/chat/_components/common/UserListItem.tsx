"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { OptimizedAvatar } from "./OptimizedAvatar";

interface UserListItemProps {
  username: string;
  avatarUrl?: string;
  onClick?: () => void;
  className?: string;
  isOnline?: boolean;
}

export const UserListItem = React.memo(
  ({
    username,
    avatarUrl,
    onClick,
    className,
    isOnline = false,
  }: UserListItemProps) => {
    const handleClick = React.useCallback(() => {
      onClick?.();
    }, [onClick]);

    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "group px-2 py-2 rounded-md flex items-center gap-x-2 w-full",
          "hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1",
          className
        )}
      >
        <div className="relative">
          <OptimizedAvatar
            src={avatarUrl}
            fallback={username[0]?.toUpperCase() || "U"}
            size="md"
          />
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
          )}
        </div>
        <p className="line-clamp-1 font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition">
          {username}
        </p>
      </button>
    );
  }
);

UserListItem.displayName = "UserListItem";
