import { create } from "zustand";
import { persist } from "zustand/middleware";

// 页面切换动画方向
export type AnimationDirection =
  | "left-to-right"
  | "right-to-left"
  | "top-to-bottom"
  | "bottom-to-top";

// 页面缓存配置
export interface PageCacheConfig {
  id: string;
  path: string;
  priority: "high" | "medium" | "low";
  maxAge: number; // 毫秒
  memoryFootprint: "small" | "medium" | "large";
  enableMobile: boolean;
  enableDesktop: boolean;
}

// 页面状态
export interface PageState {
  isVisible: boolean;
  isInitialized: boolean;
  lastAccessed: number;
  accessCount: number;
  data?: Record<string, unknown>; // 页面特定的缓存数据
}

// 内存使用情况
export interface MemoryUsage {
  used: number;
  limit: number;
  percentage: number;
  lastCheck: number;
}

interface PageCacheStore {
  // 页面状态管理
  pages: Record<string, PageState>;

  // 缓存配置
  configs: Record<string, PageCacheConfig>;

  // 内存监控
  memoryUsage: MemoryUsage;

  // 当前可见页面
  currentVisiblePage: string | null;

  // Actions
  registerPage: (config: PageCacheConfig) => void;
  showPage: (pageId: string) => void;
  hidePage: (pageId: string) => void;
  initializePage: (pageId: string, data?: Record<string, unknown>) => void;
  updatePageData: (pageId: string, data: Record<string, unknown>) => void;

  // 内存管理
  checkMemoryUsage: () => void;
  cleanupLeastRecentlyUsed: () => void;
  clearPageCache: (pageId: string) => void;

  // 获取页面状态
  getPageState: (pageId: string) => PageState | undefined;
  isPageCacheable: (pageId: string) => boolean;
}

// 预定义的页面配置
export const PAGE_CONFIGS: PageCacheConfig[] = [
  {
    id: "dashboard",
    path: "/dashboard",
    priority: "high",
    maxAge: 12 * 60 * 60 * 1000, // 12小时
    memoryFootprint: "medium",
    enableMobile: true,
    enableDesktop: true,
  },
  {
    id: "docs",
    path: "/docs",
    priority: "high",
    maxAge: 12 * 60 * 60 * 1000, // 12小时
    memoryFootprint: "medium",
    enableMobile: true,
    enableDesktop: true,
  },
  {
    id: "inbox",
    path: "/inbox",
    priority: "high",
    maxAge: 12 * 60 * 60 * 1000, // 12小时
    memoryFootprint: "medium",
    enableMobile: true,
    enableDesktop: true,
  },
  {
    id: "settings",
    path: "/settings",
    priority: "medium",
    maxAge: 12 * 60 * 60 * 1000, // 12小时
    memoryFootprint: "small",
    enableMobile: true,
    enableDesktop: true,
  },
  {
    id: "chat",
    path: "/chat",
    priority: "high",
    maxAge: 12 * 60 * 60 * 1000, // 12小时
    memoryFootprint: "medium",
    enableMobile: true,
    enableDesktop: true,
  },
];

// 检测是否为移动设备
const isMobile = () => {
  if (typeof window === "undefined") return false;
  return (
    window.innerWidth < 768 ||
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
};

// 获取内存使用情况
const getMemoryUsage = (): MemoryUsage => {
  if (typeof window === "undefined") {
    return {
      used: 0,
      limit: 0,
      percentage: 0,
      lastCheck: Date.now(),
    };
  }

  // Chrome 的 performance.memory 扩展
  const performanceMemory = (
    performance as unknown as {
      memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
    }
  )?.memory;
  if (!performanceMemory) {
    return {
      used: 0,
      limit: 0,
      percentage: 0,
      lastCheck: Date.now(),
    };
  }

  const used = performanceMemory.usedJSHeapSize || 0;
  const limit = performanceMemory.jsHeapSizeLimit || 0;

  return {
    used,
    limit,
    percentage: limit > 0 ? (used / limit) * 100 : 0,
    lastCheck: Date.now(),
  };
};

export const usePageCacheStore = create<PageCacheStore>()(
  persist(
    (set, get) => ({
      pages: {},
      configs: {},
      memoryUsage: getMemoryUsage(),
      currentVisiblePage: null,

      // 注册页面缓存配置
      registerPage: (config: PageCacheConfig) => {
        console.log(`📝 注册页面配置: ${config.id}`);
        set((state) => ({
          configs: {
            ...state.configs,
            [config.id]: config,
          },
          pages: {
            ...state.pages,
            [config.id]: state.pages[config.id] || {
              isVisible: false,
              isInitialized: false,
              lastAccessed: 0,
              accessCount: 0,
            },
          },
        }));
      },

      // 显示页面
      showPage: (pageId: string) => {
        const state = get();
        const config = state.configs[pageId];

        console.log(`🎯 尝试显示页面: ${pageId}`, {
          hasConfig: !!config,
          isCacheable: state.isPageCacheable(pageId),
          currentVisible: state.currentVisiblePage,
        });

        if (!config) {
          console.error(`❌ 页面配置不存在: ${pageId}`);
          return;
        }

        if (!state.isPageCacheable(pageId)) {
          console.error(`❌ 页面不可缓存: ${pageId}`);
          return;
        }

        // 隐藏当前页面
        if (state.currentVisiblePage && state.currentVisiblePage !== pageId) {
          get().hidePage(state.currentVisiblePage);
        }

        set((state) => ({
          currentVisiblePage: pageId,
          pages: {
            ...state.pages,
            [pageId]: {
              ...state.pages[pageId],
              isVisible: true,
              lastAccessed: Date.now(),
              accessCount: (state.pages[pageId]?.accessCount || 0) + 1,
            },
          },
        }));

        console.log(`✅ 页面已显示: ${pageId}`);

        // 如果页面还没初始化，触发初始化
        if (!state.pages[pageId]?.isInitialized) {
          setTimeout(() => {
            get().initializePage(pageId);
          }, 100);
        }

        // 检查内存使用
        get().checkMemoryUsage();
      },

      // 隐藏页面
      hidePage: (pageId: string) => {
        console.log(`🙈 隐藏页面: ${pageId}`);
        set((state) => ({
          currentVisiblePage:
            state.currentVisiblePage === pageId
              ? null
              : state.currentVisiblePage,
          pages: {
            ...state.pages,
            [pageId]: {
              ...state.pages[pageId],
              isVisible: false,
            },
          },
        }));
      },

      // 初始化页面
      initializePage: (pageId: string, data?: Record<string, unknown>) => {
        console.log(`🚀 初始化页面缓存: ${pageId}`);

        set((state) => ({
          pages: {
            ...state.pages,
            [pageId]: {
              ...state.pages[pageId],
              isInitialized: true,
              data: data || state.pages[pageId]?.data,
            },
          },
        }));
      },

      // 更新页面数据
      updatePageData: (pageId: string, data: Record<string, unknown>) => {
        set((state) => ({
          pages: {
            ...state.pages,
            [pageId]: {
              ...state.pages[pageId],
              data: {
                ...state.pages[pageId]?.data,
                ...data,
              },
            },
          },
        }));
      },

      // 检查内存使用
      checkMemoryUsage: () => {
        const usage = getMemoryUsage();

        set({ memoryUsage: usage });

        // 如果内存使用超过80%，清理缓存
        if (usage.percentage > 80) {
          console.warn("内存使用过高，开始清理缓存");
          get().cleanupLeastRecentlyUsed();
        }
      },

      // 清理最少使用的页面
      cleanupLeastRecentlyUsed: () => {
        const state = get();
        const pages = Object.entries(state.pages)
          .filter(([pageId]) => {
            const config = state.configs[pageId];
            return config && config.priority !== "high";
          })
          .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

        // 清理最少使用的页面（保留高优先级页面）
        const pageIdsToClean = pages.slice(0, Math.ceil(pages.length / 2));

        pageIdsToClean.forEach(([pageId]) => {
          get().clearPageCache(pageId);
        });
      },

      // 清理特定页面缓存
      clearPageCache: (pageId: string) => {
        console.log(`🗑️ 清理页面缓存: ${pageId}`);

        set((state) => ({
          pages: {
            ...state.pages,
            [pageId]: {
              isVisible: false,
              isInitialized: false,
              lastAccessed: 0,
              accessCount: 0,
            },
          },
        }));
      },

      // 获取页面状态
      getPageState: (pageId: string) => {
        return get().pages[pageId];
      },

      // 判断页面是否可缓存
      isPageCacheable: (pageId: string) => {
        const config = get().configs[pageId];
        if (!config) return false;

        const mobile = isMobile();

        // 根据设备类型决定是否启用缓存
        if (mobile && !config.enableMobile) return false;
        if (!mobile && !config.enableDesktop) return false;

        // 检查缓存是否过期
        const pageState = get().pages[pageId];
        if (pageState && pageState.lastAccessed) {
          const age = Date.now() - pageState.lastAccessed;
          if (age > config.maxAge) {
            get().clearPageCache(pageId);
            return false;
          }
        }

        return true;
      },
    }),
    {
      name: "page-cache-storage",
      // 只持久化必要的数据
      partialize: (state) => ({
        pages: Object.fromEntries(
          Object.entries(state.pages).map(([id, page]) => [
            id,
            {
              isInitialized: page.isInitialized,
              lastAccessed: page.lastAccessed,
              accessCount: page.accessCount,
              data: page.data,
              // 不持久化 isVisible 状态
            },
          ])
        ),
        configs: state.configs,
      }),
      version: 3, // 升级版本以重置存储
    }
  )
);

// 初始化页面配置 - 使用标志防止重复初始化
let isInitialized = false;
if (typeof window !== "undefined" && !isInitialized) {
  isInitialized = true;
  setTimeout(() => {
    const store = usePageCacheStore.getState();
    console.log("🔧 正在初始化页面配置...");
    PAGE_CONFIGS.forEach((config) => {
      store.registerPage(config);
    });
    console.log("✅ 页面配置初始化完成");
  }, 0);
}
