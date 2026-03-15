"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import ContextMenuWrapper from "@/components/ContextMenuWrapper";

import { CachedDashboardPage } from "./pages/CachedDashboardPage";
import { CachedCustomersPage } from "./pages/CachedCustomersPage";
import { CachedOrdersPage } from "./pages/CachedOrdersPage";
import { CachedAnalyticsPage } from "./pages/CachedAnalyticsPage";
import { CachedContentPage } from "./pages/CachedContentPage";

const PAGE_COMPONENTS = {
  dashboard: CachedDashboardPage,
  customers: CachedCustomersPage,
  orders: CachedOrdersPage,
  analytics: CachedAnalyticsPage,
  content: CachedContentPage,
} as const;

type PageId = keyof typeof PAGE_COMPONENTS;

const PAGE_ORDER: Record<PageId, number> = {
  dashboard: 1,
  customers: 2,
  orders: 3,
  analytics: 4,
  content: 5,
};

const getPageIdFromPath = (pathname: string): PageId | null => {
  if (pathname.includes("/dashboard")) return "dashboard";
  if (pathname.includes("/customers")) {
    return "customers";
  }
  if (pathname.includes("/orders")) {
    return "orders";
  }
  if (pathname.includes("/analytics")) {
    return "analytics";
  }
  if (pathname.includes("/content")) {
    return "content";
  }

  return null;
};

interface PageState {
  id: PageId;
  position: "left" | "center" | "right" | "hidden";
  isAnimating: boolean;
}

const getPageStyle = (state: PageState): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    transition: state.isAnimating ? "transform 300ms ease-in-out" : "none",
  };

  switch (state.position) {
    case "left":
      return { ...baseStyle, transform: "translateX(-100%)", zIndex: 5 };
    case "center":
      return { ...baseStyle, transform: "translateX(0%)", zIndex: 10 };
    case "right":
      return { ...baseStyle, transform: "translateX(100%)", zIndex: 5 };
    default:
      return { ...baseStyle, transform: "translateX(-200%)", zIndex: 1 };
  }
};

const PageRenderer = React.memo(({ state }: { state: PageState }) => {
  if (state.position === "hidden") {
    return null;
  }

  const PageComponent = PAGE_COMPONENTS[state.id];
  return (
    <div style={getPageStyle(state)}>
      <PageComponent />
    </div>
  );
});

PageRenderer.displayName = "PageRenderer";

export const GlobalPageCache = React.memo(() => {
  const pathname = usePathname();
  const [currentPageId, setCurrentPageId] = useState<PageId | null>(() =>
    getPageIdFromPath(pathname),
  );

  const [pageStates, setPageStates] = useState<Record<PageId, PageState>>(() => {
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
  });

  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performTransition = useCallback(
    (fromPageId: PageId | null, toPageId: PageId) => {
      if (fromPageId === toPageId) {
        return;
      }

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      const fromOrder = fromPageId ? PAGE_ORDER[fromPageId] : 0;
      const toOrder = PAGE_ORDER[toPageId];
      const isForward = toOrder > fromOrder;

      setPageStates((prev) => {
        const next = { ...prev };

        (Object.keys(next) as PageId[]).forEach((id) => {
          if (id !== fromPageId && id !== toPageId) {
            next[id] = { ...next[id], position: "hidden", isAnimating: false };
          }
        });

        if (fromPageId) {
          next[fromPageId] = {
            ...next[fromPageId],
            position: "center",
            isAnimating: true,
          };
        }

        next[toPageId] = {
          ...next[toPageId],
          position: isForward ? "right" : "left",
          isAnimating: true,
        };

        return next;
      });

      setTimeout(() => {
        setPageStates((prev) => {
          const next = { ...prev };

          if (fromPageId) {
            next[fromPageId] = {
              ...next[fromPageId],
              position: isForward ? "left" : "right",
              isAnimating: true,
            };
          }

          next[toPageId] = {
            ...next[toPageId],
            position: "center",
            isAnimating: true,
          };

          return next;
        });

        animationTimeoutRef.current = setTimeout(() => {
          setPageStates((prev) => {
            const next = { ...prev };

            (Object.keys(next) as PageId[]).forEach((id) => {
              next[id] = {
                ...next[id],
                position: id === toPageId ? "center" : "hidden",
                isAnimating: false,
              };
            });

            return next;
          });
        }, 300);
      }, 16);
    },
    [],
  );

  useEffect(() => {
    const nextPage = getPageIdFromPath(pathname);
    if (nextPage && nextPage !== currentPageId) {
      performTransition(currentPageId, nextPage);
      setCurrentPageId(nextPage);
    }
  }, [currentPageId, pathname, performTransition]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ContextMenuWrapper>
      <div className="relative h-full w-full overflow-hidden">
        {Object.values(pageStates).map((state) => (
          <PageRenderer key={state.id} state={state} />
        ))}
      </div>
    </ContextMenuWrapper>
  );
});

GlobalPageCache.displayName = "GlobalPageCache";
