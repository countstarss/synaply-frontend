"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

export type SidebarMode = "main" | "settings";

export function useSidebarMode() {
  const [mode, setMode] = useState<SidebarMode>("main");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pathname = usePathname();

  // 使用ref来跟踪当前模式和路径
  const currentModeRef = useRef<SidebarMode>("main");
  const previousPathnameRef = useRef<string>("");
  const isTransitioningRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 触发模式变化
  const triggerModeChange = useCallback((newMode: SidebarMode) => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 如果模式没有变化，直接返回
    if (currentModeRef.current === newMode) {
      return;
    }

    // 设置过渡状态
    isTransitioningRef.current = true;
    setIsTransitioning(true);

    // 更新模式
    currentModeRef.current = newMode;
    setMode(newMode);

    // 动画完成后重置状态
    timeoutRef.current = setTimeout(() => {
      isTransitioningRef.current = false;
      setIsTransitioning(false);
      timeoutRef.current = null;
    }, 300);
  }, []);

  // 根据路径自动切换模式
  useEffect(() => {
    const shouldShowSettings = pathname.includes("/settings");
    const newMode: SidebarMode = shouldShowSettings ? "settings" : "main";

    // 检查路径是否真的发生了变化
    const pathnameChanged = previousPathnameRef.current !== pathname;
    previousPathnameRef.current = pathname;

    // 只有在路径变化且模式需要改变时才触发
    if (pathnameChanged && currentModeRef.current !== newMode) {
      triggerModeChange(newMode);
    } else if (!pathnameChanged && currentModeRef.current !== newMode) {
      // 处理初始化情况（组件首次渲染）
      currentModeRef.current = newMode;
      setMode(newMode);
    }
  }, [pathname, triggerModeChange]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const switchToSettings = useCallback(() => {
    if (!isTransitioningRef.current) {
      triggerModeChange("settings");
    }
  }, [triggerModeChange]);

  const switchToMain = useCallback(() => {
    if (!isTransitioningRef.current) {
      triggerModeChange("main");
    }
  }, [triggerModeChange]);

  return {
    mode,
    isTransitioning,
    switchToSettings,
    switchToMain,
  };
}
