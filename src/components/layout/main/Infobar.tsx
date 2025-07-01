"use client";

import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { menuOptions } from "@/lib/data/constant";
import Link from "next/link";
import ContextMenuWrapper from "@/components/ContextMenuWrapper";
import RouterIndicator from "@/components/global/RouterIndicator";
import { cn } from "@/lib/utils";

// InfoBar 子组件
import ViewToggle, { defaultViews } from "../infobar/ViewToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface InfoBarProps {
  title?: string;
  subtitle?: string;
  showViewToggle?: boolean;
  showSearch?: boolean;
  className?: string;
}

const InfoBar = ({ showViewToggle = true, className }: InfoBarProps) => {
  const [open, setOpen] = useState(false);
  const [activeView, setActiveView] = useState("list");

  const onGetPayment = async () => {};

  useEffect(() => {
    onGetPayment();
  }, []);

  const handleViewChange = (viewId: string) => {
    setActiveView(viewId);
    // 这里可以添加视图切换逻辑
  };

  return (
    <ContextMenuWrapper>
      <div className={cn("flex flex-col w-full bg-app-bg", className)}>
        {/* 顶部栏 */}
        <div className="flex flex-row justify-between gap-6 items-center p-2 relative">
          <div className="flex flex-row gap-4 items-center">
            {/* 移动端菜单 */}
            <div className="flex md:hidden gap-4 items-center">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger>
                  <Menu className="text-xl text-white" />
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-1/2 bg-app-bg border-app-border"
                >
                  <div className="flex flex-col gap-4 p-4">
                    {menuOptions.map((menuItem) => (
                      <Link
                        href={menuItem.href}
                        key={menuItem.name}
                        onClick={() => setOpen(false)}
                      >
                        <h2 className="text-lg text-white hover:text-blue-400">
                          {menuItem.name}
                        </h2>
                      </Link>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* 桌面端路由指示器 */}
            <div className="absolute left-1/2 -translate-x-1/2 lg:flex lg:flex-row items-center hidden">
              <RouterIndicator />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* 视图切换 */}
            {showViewToggle && (
              <ViewToggle
                views={defaultViews}
                activeView={activeView}
                onViewChange={handleViewChange}
              />
            )}
          </div>
        </div>
      </div>
    </ContextMenuWrapper>
  );
};

export default InfoBar;
