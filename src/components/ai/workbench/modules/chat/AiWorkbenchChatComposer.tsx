"use client";

import { useEffect, useRef } from "react";
import { RiSendPlane2Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_COMPOSER_HEIGHT = 40;
const MAX_COMPOSER_HEIGHT = 200;

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
}: AiWorkbenchChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
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
    <div className="w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (canSend) {
            void onSend();
          }
        }}
        className={cn(
          "mx-auto grid w-full max-w-4xl grid-cols-[minmax(0,1fr)_auto] items-end gap-3 rounded-4xl p-3",
          "border border-black/[0.08] bg-white/88 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.24)] ring-1 ring-black/[0.04] backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]",
          "dark:border-white/10 dark:bg-[rgba(24,24,27,0.92)] dark:ring-white/[0.06] dark:shadow-[0_18px_44px_-28px_rgba(0,0,0,0.86)]",
        )}
      >
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
          placeholder="继续输入你的想法、blocker 或下一步动作..."
          rows={1}
          className={cn(
            "min-h-[40px] max-h-[200px] min-w-0 w-full resize-none rounded-xl border-none px-4 py-2 text-base leading-6 outline-none",
            "bg-transparent text-slate-950 [overflow-wrap:anywhere] dark:text-white",
            "placeholder:text-slate-400 dark:placeholder:text-white/28",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        />

        <div className="flex items-end self-end">
          <Button
            type="submit"
            disabled={!canSend}
            className={cn(
              "rounded-full px-4 py-2 text-white ring-inset transition-all duration-300 hover:scale-[1.02]",
              "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700",
            )}
          >
            <RiSendPlane2Line className="size-4" />
            {isSubmitting ? "发送中..." : "发送"}
          </Button>
        </div>
      </form>
    </div>
  );
}
