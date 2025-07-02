"use client";

import Infobar from "@/components/layout/main/Infobar";
import Sidebar from "@/components/layout/main/Sidebar";
import { GlobalChat } from "@/components/chat/GlobalChat";
import React from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import { useChatStore } from "@/stores/chat";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isOpen: sidebarOpen } = useSidebarStore();
  const { isVisible: chatVisible } = useChatStore();

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
        {/* InfoBar - 始终保持在顶部，不参与动画 */}
        <Infobar />

        {/* 内容区域 - 相对定位用于切换动画 */}
        <div className="relative flex-1 overflow-hidden">
          {/* 常规页面内容 */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-in-out",
              chatVisible
                ? "opacity-0 translate-x-[-100%] pointer-events-none"
                : "opacity-100 translate-x-0 pointer-events-auto"
            )}
          >
            <main className="mx-2 mb-2 bg-app-content-bg h-[calc(100vh-66px)] rounded-lg border border-app-border">
              <div className="flex-1 overflow-y-auto bg-app-content-bg rounded-lg h-full">
                {children}
              </div>
            </main>
          </div>

          {/* 全局缓存的Chat组件 */}
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-in-out",
              chatVisible
                ? "opacity-100 translate-x-0 pointer-events-auto"
                : "opacity-0 translate-x-full pointer-events-none"
            )}
          >
            <div className="mx-2 mb-2 bg-app-content-bg h-[calc(100vh-66px)] rounded-lg border border-app-border overflow-hidden">
              <GlobalChat />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
