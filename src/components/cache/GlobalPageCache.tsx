"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import ContextMenuWrapper from "@/components/ContextMenuWrapper";

// 缓存页面组件
import { CachedDocsPage } from "./pages/CachedDocsPage";
import { CachedInboxPage } from "./pages/CachedInboxPage";
import { CachedSettingsPage } from "./pages/CachedSettingsPage";
import { CachedChatPage } from "./pages/CachedChatPage";
import { CachedTasksPage } from "./pages/CachedTasksPage";
import { CachedDashboardPage } from "./pages/CachedDashboardPage";

// MARK: - 页面顺序
// NOTE:页面映射和顺序定义
const PAGE_COMPONENTS = {
  inbox: CachedInboxPage,
  tasks: CachedTasksPage,
  chat: CachedChatPage,
  docs: CachedDocsPage,
  dashboard: CachedDashboardPage,
  settings: CachedSettingsPage,
} as const;

type PageId = keyof typeof PAGE_COMPONENTS;

// MARK: 页面顺序编号：inbox(1) -> tasks(2) -> chat(3) -> docs(4) -> dashboard(5) -> settings(6)
const PAGE_ORDER: Record<PageId, number> = {
  inbox: 1,
  tasks: 2,
  chat: 3,
  docs: 4,
  dashboard: 5,
  settings: 6,
};

// 路径到页面ID的映射
const getPageIdFromPath = (pathname: string): PageId | null => {
  if (pathname.includes("/inbox")) return "inbox";
  if (pathname.includes("/tasks")) return "tasks";
  if (pathname.includes("/chat")) return "chat";
  if (pathname.includes("/docs")) return "docs";
  if (pathname.includes("/dashboard")) return "dashboard";
  if (pathname.includes("/settings")) return "settings";
  return null;
};

// 页面状态定义
interface PageState {
  id: PageId;
  position: "left" | "center" | "right" | "hidden";
  isAnimating: boolean;
}

// 计算页面样式
const getPageStyle = (state: PageState): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    transition: state.isAnimating ? "transform 300ms ease-in-out" : "none",
  };

  switch (state.position) {
    case "left":
      return {
        ...baseStyle,
        transform: "translateX(-100%)",
        zIndex: 5,
      };
    case "center":
      return {
        ...baseStyle,
        transform: "translateX(0%)",
        zIndex: 10,
      };
    case "right":
      return {
        ...baseStyle,
        transform: "translateX(100%)",
        zIndex: 5,
      };
    case "hidden":
    default:
      return {
        ...baseStyle,
        transform: "translateX(-200%)", // 完全隐藏
        zIndex: 1,
      };
  }
};

// 页面渲染器
const PageRenderer = React.memo(({ state }: { state: PageState }) => {
  // 移除对store的依赖，直接渲染页面
  if (state.position === "hidden") {
    return null;
  }

  const PageComponent = PAGE_COMPONENTS[state.id];
  const style = getPageStyle(state);

  return (
    <div style={style}>
      <PageComponent />
    </div>
  );
});

PageRenderer.displayName = "PageRenderer";

// MARK: - 页面缓存管理器
export const GlobalPageCache = React.memo(() => {
  const pathname = usePathname();
  const [currentPageId, setCurrentPageId] = useState<PageId | null>(() =>
    getPageIdFromPath(pathname),
  );
  const [pageStates, setPageStates] = useState<Record<PageId, PageState>>(
    () => {
      const initialPageId = getPageIdFromPath(pathname);
      const initialStates = {} as Record<PageId, PageState>;

      (Object.keys(PAGE_COMPONENTS) as PageId[]).forEach((pageId) => {
        initialStates[pageId] = {
          id: pageId,
          position: pageId === initialPageId ? "center" : "hidden",
          isAnimating: false,
        };
      });

      return initialStates;
    },
  );

  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // MARK: - 页面切换动画
  const performTransition = useCallback(
    (fromPageId: PageId | null, toPageId: PageId) => {
      if (fromPageId === toPageId) return;

      console.log(`🔄 页面切换: ${fromPageId} → ${toPageId}`);

      // 清除之前的动画
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      // settings 页面不使用动画，直接切换
      if (toPageId === "settings" || fromPageId === "settings") {
        setPageStates((prev) => {
          const newStates = { ...prev };
          Object.keys(newStates).forEach((id) => {
            newStates[id as PageId] = {
              ...newStates[id as PageId],
              position: id === toPageId ? "center" : "hidden",
              isAnimating: false,
            };
          });
          return newStates;
        });
        return;
      }

      const fromOrder = fromPageId ? PAGE_ORDER[fromPageId] : 0;
      const toOrder = PAGE_ORDER[toPageId];
      const isForward = toOrder > fromOrder; // 是否向前切换

      // MARK: - 1. 构建切换堆栈
      setPageStates((prev) => {
        const newStates = { ...prev };

        // 隐藏所有其他页面
        Object.keys(newStates).forEach((id) => {
          if (id !== fromPageId && id !== toPageId) {
            newStates[id as PageId] = {
              ...newStates[id as PageId],
              position: "hidden",
              isAnimating: false,
            };
          }
        });

        if (fromPageId) {
          // 当前页面在中央
          newStates[fromPageId] = {
            ...newStates[fromPageId],
            position: "center",
            isAnimating: true,
          };
        }

        if (isForward) {
          // 向前：目标页面在右侧
          newStates[toPageId] = {
            ...newStates[toPageId],
            position: "right",
            isAnimating: true,
          };
        } else {
          // 向后：目标页面在左侧
          newStates[toPageId] = {
            ...newStates[toPageId],
            position: "left",
            isAnimating: true,
          };
        }

        return newStates;
      });

      // MARK: - 2. 开始动画
      // NOTE: 同时向目标方向移动
      setTimeout(() => {
        setPageStates((prev) => {
          const newStates = { ...prev };

          if (fromPageId) {
            if (isForward) {
              // 向前：当前页面移动到左侧
              newStates[fromPageId] = {
                ...newStates[fromPageId],
                position: "left",
                isAnimating: true,
              };
            } else {
              // 向后：当前页面移动到右侧
              newStates[fromPageId] = {
                ...newStates[fromPageId],
                position: "right",
                isAnimating: true,
              };
            }
          }

          // 目标页面移动到中央
          newStates[toPageId] = {
            ...newStates[toPageId],
            position: "center",
            isAnimating: true,
          };

          return newStates;
        });

        // MARK: - 3. 清理堆栈
        animationTimeoutRef.current = setTimeout(() => {
          setPageStates((prev) => {
            const newStates = { ...prev };

            // NOTE: 只保留当前页面，其他页面隐藏
            Object.keys(newStates).forEach((id) => {
              if (id === toPageId) {
                newStates[id as PageId] = {
                  ...newStates[id as PageId],
                  position: "center",
                  isAnimating: false,
                };
              } else {
                newStates[id as PageId] = {
                  ...newStates[id as PageId],
                  position: "hidden",
                  isAnimating: false,
                };
              }
            });

            return newStates;
          });
        }, 300); // 等待动画完成
      }, 16); // 下一帧开始动画
    },
    [setPageStates],
  );

  // MARK: - 监听路径变化
  // NOTE: 简化逻辑，避免循环
  useEffect(() => {
    const newPageId = getPageIdFromPath(pathname);

    if (newPageId && newPageId !== currentPageId) {
      console.log(`🌟 路径变化触发页面切换: ${pathname} → ${newPageId}`);

      // 执行动画
      performTransition(currentPageId, newPageId);

      // 更新当前页面ID
      setCurrentPageId(newPageId);
    }
  }, [pathname, currentPageId, performTransition]);

  // MARK: - 清理函数
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ContextMenuWrapper>
      <div className="relative w-full h-full overflow-hidden">
        {Object.values(pageStates).map((state) => (
          <PageRenderer key={state.id} state={state} />
        ))}
      </div>
    </ContextMenuWrapper>
  );
});

GlobalPageCache.displayName = "GlobalPageCache";
