"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, ChevronDown, GitBranchPlus, ShieldAlert, SplitSquareVertical } from "lucide-react";
import type { AiMessageRecord } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { AiWorkbenchChatComposer } from "@/components/ai/workbench/modules/chat/AiWorkbenchChatComposer";
import { AiWorkbenchChatMessage } from "@/components/ai/workbench/modules/chat/AiWorkbenchChatMessage";
import { cn } from "@/lib/utils";

interface AiWorkbenchChatPanelProps {
  messages: AiMessageRecord[];
  draft: string;
  onDraftChange: (value: string) => void;
  onPrefillSuggestion?: (value: string) => void;
  onSend: () => Promise<void> | void;
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingText?: string;
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
  onSend,
  isLoading = false,
  isStreaming = false,
  streamingText = "",
  disabled = false,
  isSubmitting = false,
  error = null,
}: AiWorkbenchChatPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const previousMessagesCountRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const hasMessages = useMemo(
    () => messages.length > 0 || isStreaming,
    [isStreaming, messages.length],
  );

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    endRef.current?.scrollIntoView({ behavior, block: "end" });
    setIsAutoScrollEnabled(true);
  };

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom = distanceFromBottom < 120;

      setShowScrollButton(!isNearBottom);
      setIsAutoScrollEnabled(isNearBottom);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const hasNewMessage = messages.length > previousMessagesCountRef.current;

    if ((hasNewMessage || isStreaming) && isAutoScrollEnabled) {
      scrollToBottom(hasNewMessage ? "smooth" : "auto");
    }

    previousMessagesCountRef.current = messages.length;
  }, [isAutoScrollEnabled, isStreaming, messages.length, streamingText]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-[rgba(7,9,13,0.38)] to-transparent" />

      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 pb-44 pt-6 sm:px-6 lg:px-8">
          {isLoading && !hasMessages ? (
            <div className="flex min-h-[360px] flex-1 items-center justify-center text-sm text-white/52">
              正在同步线程和消息历史...
            </div>
          ) : !hasMessages ? (
            <div className="flex min-h-[420px] flex-1 items-center justify-center">
              <div className="w-full max-w-3xl rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,19,27,0.94),rgba(9,11,17,0.94))] p-6 shadow-[0_30px_120px_-72px_rgba(0,0,0,0.95)] sm:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-sky-200/90">
                  <Bot className="size-3.5" />
                  AI Workbench
                </div>

                <h3 className="mt-5 max-w-2xl text-2xl font-semibold tracking-tight text-white sm:text-[30px]">
                  从一个模糊想法开始，把讨论推进成可交付的下一步。
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/52 sm:text-[15px]">
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
                        className="group rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-left transition hover:border-white/14 hover:bg-white/[0.05]"
                      >
                        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/34">
                          <Icon className="size-3.5" />
                          {item.eyebrow}
                        </div>
                        <p className="mt-4 text-sm font-medium leading-6 text-white">
                          {item.title}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-white/42">
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
                <AiWorkbenchChatMessage key={message.id} message={message} />
              ))}

              {isStreaming ? (
                <AiWorkbenchChatMessage streamingText={streamingText} />
              ) : null}
            </div>
          )}

          <div ref={endRef} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[rgba(8,10,15,0.98)] via-[rgba(8,10,15,0.88)] to-transparent" />

      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <AiWorkbenchChatComposer
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
            "absolute bottom-44 right-6 z-20 rounded-full border border-white/10 bg-[rgba(18,22,30,0.94)] text-white shadow-[0_18px_48px_-28px_rgba(0,0,0,0.9)] hover:bg-[rgba(24,29,39,0.98)]",
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
