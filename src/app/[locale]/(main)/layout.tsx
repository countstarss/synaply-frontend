"use client";

import Infobar from "@/components/layout/main/Infobar";
import Sidebar from "@/components/layout/main/Sidebar";
import React from "react";
import { usePathname } from "next/navigation";
import { shouldHideInfobar } from "@/config/infobar.config";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();

  // 使用配置文件中的函数检查是否隐藏Infobar
  const hideInfobar = shouldHideInfobar(pathname);

  return (
    <div className="flex h-screen bg-app-bg overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* InfoBar - 根据路由条件显示 */}
        {!hideInfobar && <Infobar />}
        <main
          className={cn(
            "mx-2 mb-2 bg-app-content-bg h-full rounded-lg border border-app-border",
            hideInfobar && "mt-2"
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
