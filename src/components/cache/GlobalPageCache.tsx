"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePageCacheStore } from "@/stores/pageCache";
import ContextMenuWrapper from "@/components/ContextMenuWrapper";

// 缓存页面组件
import { CachedDocsPage } from "./pages/CachedDocsPage";
import { CachedInboxPage } from "./pages/CachedInboxPage";
import { CachedSettingsPage } from "./pages/CachedSettingsPage";
import { CachedDashboardPage } from "./pages/CachedDashboardPage";

// 页面映射
const PAGE_COMPONENTS = {
  docs: CachedDocsPage,
  inbox: CachedInboxPage,
  settings: CachedSettingsPage,
  dashboard: CachedDashboardPage,
} as const;

type PageId = keyof typeof PAGE_COMPONENTS;

// 路径到页面ID的映射
const getPageIdFromPath = (pathname: string): PageId | null => {
  if (pathname.includes("/docs")) return "docs";
  if (pathname.includes("/inbox")) return "inbox";
  if (pathname.includes("/settings")) return "settings";
  if (pathname.includes("/dashboard")) return "dashboard";
  return null;
};

interface CachedPageRendererProps {
  pageId: PageId;
}

// 单个缓存页面渲染器
const CachedPageRenderer = React.memo(({ pageId }: CachedPageRendererProps) => {
  const { getPageState } = usePageCacheStore();
  const pageState = getPageState(pageId);

  // 如果页面状态不存在，不渲染
  if (!pageState) {
    return null;
  }

  const PageComponent = PAGE_COMPONENTS[pageId];

  return (
    <div
      className="absolute inset-0 transition-all duration-300 ease-in-out"
      style={{
        opacity: pageState.isVisible ? 1 : 0,
        transform: pageState.isVisible ? "translateX(0)" : "translateX(100%)",
        pointerEvents: pageState.isVisible ? "auto" : "none",
      }}
    >
      <PageComponent />
    </div>
  );
});

CachedPageRenderer.displayName = "CachedPageRenderer";

// 全局页面缓存管理器
export const GlobalPageCache = React.memo(() => {
  const { showPage, hidePage, currentVisiblePage } = usePageCacheStore();
  const pathname = usePathname();

  // 根据路径控制页面显示/隐藏
  useEffect(() => {
    const pageId = getPageIdFromPath(pathname);

    console.log("🔄 GlobalPageCache路径变化:", {
      pathname,
      pageId,
      currentVisiblePage,
    });

    if (pageId) {
      // 隐藏当前显示的页面
      if (currentVisiblePage && currentVisiblePage !== pageId) {
        hidePage(currentVisiblePage);
      }
      // 显示新页面
      showPage(pageId);
    } else {
      // 如果当前有可见页面且不匹配路径，隐藏它
      if (currentVisiblePage) {
        hidePage(currentVisiblePage);
      }
    }
  }, [pathname, showPage, hidePage, currentVisiblePage]);

  return (
    <ContextMenuWrapper>
      <div className="relative w-full h-full overflow-hidden">
        {/* 渲染所有缓存的页面 */}
        {(Object.keys(PAGE_COMPONENTS) as PageId[]).map((pageId) => (
          <CachedPageRenderer key={pageId} pageId={pageId} />
        ))}
      </div>
    </ContextMenuWrapper>
  );
});

GlobalPageCache.displayName = "GlobalPageCache";
