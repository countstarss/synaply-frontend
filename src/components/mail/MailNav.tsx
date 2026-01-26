"use client";

import * as React from "react";
import {
  Archive,
  ArchiveX,
  File,
  Inbox,
  PenBox,
  Send,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavItem } from "./NavItem";
import { AccountSwitcher } from "./AccountSwitcher";
import { useMailStore } from "./use-mail-store";
import { NavLinkItem, EmailAccount } from "./types";
import { getUnreadCount } from "./mock-data";

interface MailNavProps {
  accounts: EmailAccount[];
  isCollapsed: boolean;
  onCompose?: () => void;
}

export function MailNav({
  accounts,
  isCollapsed,
  onCompose,
}: MailNavProps) {
  const { currentFolder, setCurrentFolder, emails } = useMailStore();

  // 主要链接数据
  const mainLinks: NavLinkItem[] = [
    {
      title: "收件箱",
      label: getUnreadCount(emails, "inbox").toString() || "",
      icon: Inbox,
      variant: currentFolder === "inbox" ? "default" : "ghost",
      onClick: () => setCurrentFolder("inbox"),
    },
    {
      title: "草稿箱",
      label: getUnreadCount(emails, "draft").toString() || "",
      icon: File,
      variant: currentFolder === "draft" ? "default" : "ghost",
      onClick: () => setCurrentFolder("draft"),
    },
    {
      title: "已发送",
      label: "",
      icon: Send,
      variant: currentFolder === "sent" ? "default" : "ghost",
      onClick: () => setCurrentFolder("sent"),
    },
    {
      title: "垃圾箱",
      label: "",
      icon: ArchiveX,
      variant: currentFolder === "junk" ? "default" : "ghost",
      onClick: () => setCurrentFolder("junk"),
    },
  ];

  // 存档和垃圾箱链接
  const secondaryLinks: NavLinkItem[] = [
    {
      title: "删除",
      label: "",
      icon: Trash2,
      variant: currentFolder === "trash" ? "default" : "ghost",
      onClick: () => setCurrentFolder("trash"),
    },
    {
      title: "存档",
      label: "",
      icon: Archive,
      variant: currentFolder === "archive" ? "default" : "ghost",
      onClick: () => setCurrentFolder("archive"),
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col bg-background border-r h-full transition-all duration-300",
        isCollapsed ? "w-[60px] items-center" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center p-4 pb-2">
        {isCollapsed ? (
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">Mail</h2>
          </div>
        ) : (
          <div className="flex flex-col w-full items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <h2 className="font-sans text-2xl font-extrabold">Mail</h2>
            </div>
          </div>
        )}
      </div>

      {/* Account Switcher */}
      <div className="px-2">
        <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
      </div>

      {/* Compose Button */}
      <div
        className={cn(
          "flex flex-col",
          isCollapsed ? "items-center" : "justify-start"
        )}
      >
        <div
          className={cn(
            "mt-2 w-full",
            isCollapsed ? "flex flex-col items-center px-2" : "justify-start px-2"
          )}
        >
          <Button
            variant="ghost"
            className={cn(
              "rounded-md bg-primary text-primary-foreground shadow transition-all",
              isCollapsed
                ? "w-9 h-9 p-0 flex items-center justify-center"
                : "w-full px-4 py-2 flex items-center justify-start"
            )}
            onClick={() => {
              // TODO: 打开写邮件弹窗
              onCompose?.();
            }}
          >
            <PenBox className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
            {!isCollapsed && <span className="font-medium">Compose</span>}
          </Button>
        </div>
      </div>

      {/* Navigation Links */}
      <ScrollArea className="flex-1 mt-2">
        <span
          className={cn(
            "text-muted-foreground text-xs px-4",
            isCollapsed && "hidden"
          )}
        >
          Main
        </span>
        <NavItem isCollapsed={isCollapsed} links={mainLinks} />

        {/* 存档和垃圾箱 */}
        <span
          className={cn(
            "text-muted-foreground text-xs px-4 mt-4 block",
            isCollapsed && "hidden"
          )}
        >
          System
        </span>
        <NavItem isCollapsed={isCollapsed} links={secondaryLinks} />
      </ScrollArea>

      {/* User Info (Bottom) */}
      <div
        className={cn(
          "p-4 border-t",
          isCollapsed ? "px-2" : "px-4"
        )}
      >
        {isCollapsed ? (
          <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center overflow-hidden mx-auto">
            <span className="font-medium text-sm">LK</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 bg-muted rounded-lg p-2 w-full">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="font-medium text-xs text-primary">LK</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Luke</span>
              <span className="text-xs text-muted-foreground">
                luke@synaply.com
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
