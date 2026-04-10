"use client";

import Infobar from "@/components/layout/main/Infobar";
import Sidebar from "@/components/layout/main/Sidebar";
import { GlobalPageCache } from "@/components/cache/GlobalPageCache";
import React from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar";
import { usePathname, useSelectedLayoutSegments } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
}

const BORDERLESS_CONTENT_SHELL_ROUTES = [
  "/issues/:issueId",
  "/projects/:projectId/:issueId",
] as const;
const PROJECT_SUBVIEW_ROUTE_SEGMENTS = new Set([
  "issues",
  "docs",
  "workflow",
  "sync",
]);

function normalizeRoutePathname(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(firstSegment)) {
    segments.shift();
  }

  return `/${segments.join("/")}` || "/";
}

function shouldUseBorderlessContentShell(pathname: string) {
  const routePathname = normalizeRoutePathname(pathname);

  return BORDERLESS_CONTENT_SHELL_ROUTES.some((route) =>
    routeMatchesPattern(routePathname, route),
  );
}

function routeMatchesPattern(pathname: string, routePattern: string) {
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const routePatternSegments = routePattern.split("/").filter(Boolean);

  if (pathnameSegments.length !== routePatternSegments.length) {
    return false;
  }

  return routePatternSegments.every((segment, index) => {
    if (segment.startsWith(":")) {
      if (
        routePatternSegments[0] === "projects" &&
        segment === ":issueId" &&
        PROJECT_SUBVIEW_ROUTE_SEGMENTS.has(pathnameSegments[index])
      ) {
        return false;
      }

      return Boolean(pathnameSegments[index]);
    }

    return segment === pathnameSegments[index];
  });
}

const Layout = ({ children }: LayoutProps) => {
  const { isOpen: sidebarOpen } = useSidebarStore();
  const segments = useSelectedLayoutSegments();
  const pathname = usePathname();
  const showCachedPage = segments.includes("(cached)");
  const useBorderlessContentShell = shouldUseBorderlessContentShell(pathname);
  const previousPathnameRef = React.useRef(pathname);
  const shouldBypassShellAnimation =
    pathname.includes("/settings") ||
    previousPathnameRef.current.includes("/settings");

  React.useEffect(() => {
    previousPathnameRef.current = pathname;
  }, [pathname]);

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
          "flex-1 flex flex-col overflow-hidden relative",
          sidebarOpen ? "ml-2" : "ml-0"
        )}
      >
        {/* InfoBar - 始终保持在顶部，不参与动画 */}
        <Infobar />

        {/* 内容区域 - 相对定位用于切换动画 */}
        <div className="relative flex-1 overflow-hidden">
          {/* 常规页面内容 - 正确的从左向右滑动 */}
          <div
            className={cn(
              "absolute inset-0",
              !shouldBypassShellAnimation &&
                "transition-all duration-300 ease-in-out",
              showCachedPage
                ? "opacity-0 translate-x-full pointer-events-none" // 向右退出
                : "opacity-100 translate-x-0 pointer-events-auto"
            )}
          >
            <main
              className={cn(
                "mx-2 mb-2 h-[calc(100vh-64px)] overflow-hidden rounded-lg",
                !useBorderlessContentShell &&
                  "border border-app-border bg-app-content-bg",
              )}
            >
              <div
                className={cn(
                  "flex-1 h-full overflow-y-auto rounded-lg",
                  !useBorderlessContentShell && "bg-app-content-bg",
                )}
              >
                {children}
              </div>
            </main>
          </div>

          {/* 全局页面缓存系统 - 正确的从左向右滑动 */}
          <div
            className={cn(
              "absolute inset-0",
              !shouldBypassShellAnimation &&
                "transition-all duration-300 ease-in-out",
              showCachedPage
                ? "opacity-100 translate-x-0 pointer-events-auto" // 从左滑入到中央
                : "opacity-0 translate-x-[-100%] pointer-events-none" // 在左侧待命
            )}
          >
            {/* 保持与常规内容相同的结构和间距 */}
            <div className="flex flex-col h-full">
              <div
                className={cn(
                  "mx-2 mb-2 h-[calc(100vh-64px)] overflow-hidden rounded-lg",
                  !useBorderlessContentShell &&
                    "border border-app-border bg-app-content-bg",
                )}
              >
                <GlobalPageCache />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
