"use client";

import React from "react";
import { cn } from "@/lib/utils";
import SidebarBrand from "../sidebar/SidebarBrand";
import SidebarNavItem from "../sidebar/SidebarNavItem";
import SidebarSection from "../sidebar/SidebarSection";
import SidebarFooter from "../sidebar/SidebarFooter";
import { useSidebarStore } from "@/stores/sidebar";
import {
  mainNavItems,
  personalItems,
  workspaceItems,
} from "@/lib/data/constant";

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const { isOpen: sidebarOpen } = useSidebarStore();

  return (
    <div
      className={cn(
        "w-64 h-[calc(100vh-16px)] bg-app-bg lg:flex hidden flex-col my-2 ml-2 mr-0 border border-app-border rounded-lg",
        "transition-transform duration-300 ease-in-out",
        !sidebarOpen && "pointer-events-none", // 隐藏时禁用交互
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
