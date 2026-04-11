"use client";

import { useEffect, useRef } from "react";
import { RiSendPlane2Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_COMPOSER_HEIGHT = 56;
const MAX_COMPOSER_HEIGHT = 220;

interface AiWorkbenchChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => Promise<void> | void;
  disabled?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
}

export function AiWorkbenchChatComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  isSubmitting = false,
  error = null,
}: AiWorkbenchChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, MIN_COMPOSER_HEIGHT),
      MAX_COMPOSER_HEIGHT,
    );

    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > MAX_COMPOSER_HEIGHT ? "auto" : "hidden";
  }, [value]);

  const canSend = Boolean(value.trim()) && !disabled && !isSubmitting;

  return (
    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,30,0.98),rgba(9,11,16,0.98))] shadow-[0_24px_90px_-48px_rgba(0,0,0,0.9)] backdrop-blur-xl">
      <div className="flex items-end gap-3 p-4">
        <div className="min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (canSend) {
                  void onSend();
                }
              }
            }}
            disabled={disabled || isSubmitting}
            placeholder="直接说你的想法，或者告诉 AI 现在想推进哪个项目 / issue。"
            rows={1}
            className={cn(
              "w-full resize-none border-0 bg-transparent px-0 py-0 text-[15px] leading-7 text-white outline-none placeholder:text-white/28",
              "[overflow-wrap:anywhere]",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          />
        </div>

        <Button
          type="button"
          disabled={!canSend}
          className="h-11 rounded-2xl bg-white px-4 text-slate-950 hover:bg-white/92"
          onClick={() => void onSend()}
        >
          <RiSendPlane2Line className="size-4" />
          发送
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-4 py-3 text-xs">
        <p className="text-white/38">
          当前会写入 AI thread / runs / steps。Tool 与审批卡片保持可执行。
        </p>

        <div className="flex max-w-full flex-wrap items-center justify-end gap-3">
          {error ? (
            <span className="max-w-sm text-right leading-5 text-amber-200/90">
              {error}
            </span>
          ) : null}
          <span className="text-white/26">Enter 发送，Shift + Enter 换行</span>
        </div>
      </div>
    </div>
  );
}
