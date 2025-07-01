"use client";

import Infobar from "@/components/layout/main/Infobar";
import Sidebar from "@/components/layout/main/Sidebar";
import React from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isOpen: sidebarOpen } = useSidebarStore();

  return (
    <div className="flex h-screen bg-app-bg overflow-hidden">
      {/* Sidebar - 使用动画控制显示/隐藏 */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0 overflow-hidden"
        )}
      >
        <Sidebar />
      </div>

      {/* Main Content - 始终保持8px间隔 */}
      <div
        className={cn(
          "flex-1 flex flex-col overflow-hidden",
          sidebarOpen ? "ml-2" : "ml-0"
        )}
      >
        {/* InfoBar - 根据路由条件显示 */}
        <Infobar />
        <main
          className={cn(
            "mx-2 mb-2 bg-app-content-bg h-full rounded-lg border border-app-border"
          )}
        >
          <div className="flex-1 overflow-y-auto bg-app-content-bg rounded-lg">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
