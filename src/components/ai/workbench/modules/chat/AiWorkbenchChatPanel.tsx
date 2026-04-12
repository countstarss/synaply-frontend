"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, ChevronDown, GitBranchPlus, ShieldAlert, SplitSquareVertical } from "lucide-react";
import type { AiMessageRecord } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { AiWorkbenchInputArea } from "@/components/ai/workbench/modules/chat/AiWorkbenchInputArea";
import { AiWorkbenchChatMessage } from "@/components/ai/workbench/modules/chat/AiWorkbenchChatMessage";
import { useAiWorkbenchSelectionStore } from "@/components/ai/workbench/modules/chat/AiWorkbenchSelectionStore";
import { cn } from "@/lib/utils";

interface AiWorkbenchChatPanelProps {
  messages: AiMessageRecord[];
  draft: string;
  onDraftChange: (value: string) => void;
  onPrefillSuggestion?: (value: string) => void;
  onQuickReply?: (value: string) => Promise<void> | void;
  onSend: () => Promise<void> | void;
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingText?: string;
  pendingViewportAnchorId?: string | null;
  disabled?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
}

const suggestionCards = [
  {
    key: "project-brief",
    icon: GitBranchPlus,
    eyebrow: "PROJECT BRIEF",
    title: "把想法收束成项目和首批 issue",
    prompt: "请把这个想法整理成项目 brief，并拆成第一批可执行 issue。",
  },
  {
    key: "handoff",
    icon: SplitSquareVertical,
    eyebrow: "HANDOFF",
    title: "提前暴露确认点和交接动作",
    prompt: "请根据当前上下文列出需要谁确认、如何 handoff，以及下一步由谁接手。",
  },
  {
    key: "risk",
    icon: ShieldAlert,
    eyebrow: "RISK CHECK",
    title: "先识别 blockers、依赖和恢复条件",
    prompt: "请帮我梳理这项工作的 blockers、依赖和恢复推进的前提。",
  },
] as const;

export function AiWorkbenchChatPanel({
  messages,
  draft,
  onDraftChange,
  onPrefillSuggestion,
  onQuickReply,
  onSend,
  isLoading = false,
  isStreaming = false,
  streamingText = "",
  pendingViewportAnchorId = null,
  disabled = false,
  isSubmitting = false,
  error = null,
}: AiWorkbenchChatPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const previousMessagesCountRef = useRef(0);
  const lastAnchoredMessageIdRef = useRef<string | null>(null);
  const scrollAnimationFrameRef = useRef<number | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [containerViewportHeight, setContainerViewportHeight] = useState(0);
  const isSelectionMode = useAiWorkbenchSelectionStore(
    (state) => state.isSelectionMode,
  );
  const autoSelectEnabled = useAiWorkbenchSelectionStore(
    (state) => state.autoSelectEnabled,
  );
  const addToSelection = useAiWorkbenchSelectionStore(
    (state) => state.addToSelection,
  );
  const resetSelectionState = useAiWorkbenchSelectionStore(
    (state) => state.resetSelectionState,
  );

  const hasMessages = useMemo(
    () => messages.length > 0 || isStreaming,
    [isStreaming, messages.length],
  );
  const threadKey = messages[0]?.threadId ?? "__empty__";
  const lastMessage = messages.at(-1);
  const shouldReserveViewportSpace =
    !!pendingViewportAnchorId || isStreaming || lastMessage?.role === "USER";
  const viewportSpacerHeight = shouldReserveViewportSpace
    ? Math.max(containerViewportHeight - 256, 220)
    : 0;

  const stopScrollAnimation = useCallback(() => {
    if (scrollAnimationFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }
  }, []);

  const animateScrollTo = useCallback((top: number, duration = 240) => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    stopScrollAnimation();

    const startTop = container.scrollTop;
    const delta = top - startTop;

    if (Math.abs(delta) < 4) {
      container.scrollTop = top;
      return;
    }

    const startTime = performance.now();

    const step = (currentTime: number) => {
      const progress = Math.min(1, (currentTime - startTime) / duration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      container.scrollTop = startTop + delta * easedProgress;

      if (progress < 1) {
        scrollAnimationFrameRef.current = requestAnimationFrame(step);
        return;
      }

      scrollAnimationFrameRef.current = null;
    };

    scrollAnimationFrameRef.current = requestAnimationFrame(step);
  }, [stopScrollAnimation]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior, block: "end" });
    setIsAutoScrollEnabled(true);
  };

  const handleMessageInView = (isInView: boolean, message: AiMessageRecord) => {
    if (isInView && isSelectionMode && autoSelectEnabled) {
      addToSelection(message);
    }
  };

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const syncViewportMetrics = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom = distanceFromBottom < 120;

      setShowScrollButton(!isNearBottom);
      setIsAutoScrollEnabled(isNearBottom);
      setContainerViewportHeight(container.clientHeight);
    };

    syncViewportMetrics();
    container.addEventListener("scroll", syncViewportMetrics, { passive: true });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            syncViewportMetrics();
          })
        : null;

    resizeObserver?.observe(container);

    return () => {
      container.removeEventListener("scroll", syncViewportMetrics);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    return () => {
      stopScrollAnimation();
    };
  }, [stopScrollAnimation]);

  useEffect(() => {
    if (!pendingViewportAnchorId) {
      return;
    }

    if (lastAnchoredMessageIdRef.current === pendingViewportAnchorId) {
      return;
    }

    const container = containerRef.current;
    const target = document.getElementById(`message-${pendingViewportAnchorId}`);

    if (!container || !target) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTop = Math.max(
      0,
      container.scrollTop + (targetRect.top - containerRect.top),
    );

    animateScrollTo(targetTop, 260);
    lastAnchoredMessageIdRef.current = pendingViewportAnchorId;
    setIsAutoScrollEnabled(false);
  }, [animateScrollTo, messages.length, pendingViewportAnchorId]);

  useEffect(() => {
    const hasNewMessage = messages.length > previousMessagesCountRef.current;

    if ((hasNewMessage || isStreaming) && isAutoScrollEnabled) {
      scrollToBottom(hasNewMessage ? "smooth" : "auto");
    }

    previousMessagesCountRef.current = messages.length;
  }, [isAutoScrollEnabled, isStreaming, messages.length, streamingText]);

  useEffect(() => {
    resetSelectionState();
  }, [resetSelectionState, threadKey]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-white/58 to-transparent dark:from-[rgba(12,12,14,0.34)]" />

      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 pb-44 pt-6 sm:px-6 lg:px-8">
          {isLoading && !hasMessages ? (
            <div className="flex min-h-[360px] flex-1 items-center justify-center text-sm text-slate-500 dark:text-white/52">
              正在同步线程和消息历史...
            </div>
          ) : !hasMessages ? (
            <div className="flex min-h-[420px] flex-1 items-center justify-center">
              <div className="w-full max-w-3xl rounded-[32px] border border-black/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] p-6 shadow-[0_30px_120px_-72px_rgba(15,23,42,0.18)] dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(26,26,29,0.96),rgba(14,14,16,0.98))] dark:shadow-[0_30px_120px_-72px_rgba(0,0,0,0.95)] sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200/90">
                  <Bot className="size-3.5" />
                  AI Workbench
                </div>

                <h3 className="mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-[30px]">
                  从一个模糊想法开始，把讨论推进成可交付的下一步。
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-white/52 sm:text-[15px]">
                  这里保留真实可执行的 tool / approval 流程，只把聊天交互换成更稳定的工作台壳层。
                  长文本、长结果和连续输入都会被限制在更稳的版式里。
                </p>

                <div className="mt-8 grid gap-3 md:grid-cols-3">
                  {suggestionCards.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => onPrefillSuggestion?.(item.prompt)}
                        className="group rounded-[24px] border border-black/[0.06] bg-black/[0.02] p-4 text-left transition hover:border-black/[0.1] hover:bg-black/[0.04] dark:border-white/8 dark:bg-white/[0.03] dark:hover:border-white/14 dark:hover:bg-white/[0.05]"
                      >
                        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-white/34">
                          <Icon className="size-3.5" />
                          {item.eyebrow}
                        </div>
                        <p className="mt-4 text-sm font-medium leading-6 text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-white/42">
                          {item.prompt}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <AiWorkbenchChatMessage
                  key={message.id}
                  message={message}
                  onInView={handleMessageInView}
                  onQuickReply={onQuickReply}
                  disableQuickReply={isSubmitting}
                />
              ))}

              {isStreaming ? (
                <AiWorkbenchChatMessage streamingText={streamingText} />
              ) : null}
            </div>
          )}

          {hasMessages && viewportSpacerHeight > 0 ? (
            <div
              aria-hidden
              className="pointer-events-none shrink-0 transition-[height] duration-200 ease-out"
              style={{ height: `${viewportSpacerHeight}px` }}
            />
          ) : null}

          <div ref={endRef} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white/96 via-white/84 to-transparent dark:from-[rgba(12,12,14,0.98)] dark:via-[rgba(12,12,14,0.88)]" />

      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <AiWorkbenchInputArea
            value={draft}
            onChange={onDraftChange}
            onSend={onSend}
            disabled={disabled}
            isSubmitting={isSubmitting}
            error={error}
          />
        </div>
      </div>

      {showScrollButton ? (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className={cn(
            "absolute bottom-44 right-6 z-20 rounded-full border border-black/[0.06] bg-white/92 text-slate-700 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.22)] hover:bg-white dark:border-white/10 dark:bg-[rgba(24,24,27,0.96)] dark:text-white dark:shadow-[0_18px_48px_-28px_rgba(0,0,0,0.9)] dark:hover:bg-[rgba(30,30,34,0.98)]",
            "sm:right-8",
          )}
          onClick={() => scrollToBottom()}
        >
          <ChevronDown className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
