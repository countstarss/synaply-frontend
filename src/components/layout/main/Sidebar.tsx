"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Inbox,
  ListCheck,
  MessageSquareCode,
  BookAIcon,
  FolderOpen,
  Eye,
  FileText,
} from "lucide-react";

import SidebarBrand from "../sidebar/SidebarBrand";
import SidebarNavItem from "../sidebar/SidebarNavItem";
import SidebarSection from "../sidebar/SidebarSection";
import SidebarFooter from "../sidebar/SidebarFooter";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  // 主要导航菜单
  const mainNavItems = [
    { icon: Inbox, label: "Inbox", href: "/inbox" },
    { icon: ListCheck, label: "My Task", href: "/tasks" },
    { icon: MessageSquareCode, label: "Chat", href: "/chat" },
    { icon: BookAIcon, label: "Docs", href: "/docs" },
  ];

  // WorkSpace 子项
  const workspaceItems = [
    { icon: FolderOpen, label: "Projects", href: "/workspace/projects" },
    { icon: Eye, label: "Views", href: "/workspace/views" },
    { icon: FileText, label: "Docs", href: "/workspace/docs" },
  ];

  // Personal 子项
  const personalItems = [
    { icon: FolderOpen, label: "Projects", href: "/personal/projects" },
    { icon: Eye, label: "Views", href: "/personal/views" },
    { icon: FileText, label: "Docs", href: "/personal/docs" },
  ];

  return (
    <div
      className={cn(
        "w-64 h-[calc(100vh-16px)] bg-app-bg lg:flex hidden flex-col my-2 ml-2 border border-app-border rounded-lg",
        className
      )}
    >
      {/* 品牌标识 */}
      <SidebarBrand />

      {/* 主要导航 */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 py-2">
          {mainNavItems.map((item) => {
            return (
              <SidebarNavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
              />
            );
          })}
        </div>

        {/* WorkSpace 部分 */}
        <SidebarSection title="WorkSpace">
          {workspaceItems.map((item) => {
            return (
              <SidebarNavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
              />
            );
          })}
        </SidebarSection>

        {/* Personal 部分 */}
        <SidebarSection title="Personal">
          {personalItems.map((item) => {
            return (
              <SidebarNavItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
              />
            );
          })}
        </SidebarSection>
      </div>

      {/* 底部品牌信息 */}
      <SidebarFooter />
    </div>
  );
};

export default Sidebar;
