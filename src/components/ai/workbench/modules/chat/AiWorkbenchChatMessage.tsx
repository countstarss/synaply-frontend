"use client";

import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiMessagePart, AiMessageRecord } from "@/lib/ai/types";
import { AiApprovalRequestCard } from "@/components/ai/thread/AiApprovalRequestCard";
import { AiCodingPromptCard } from "@/components/ai/thread/AiCodingPromptCard";
import { AiToolResultCard } from "@/components/ai/thread/AiToolResultCard";

interface AiWorkbenchChatMessageProps {
  message?: AiMessageRecord;
  streamingText?: string;
}

function renderTextPart(text: string, className?: string) {
  return (
    <pre
      className={cn(
        "w-full whitespace-pre-wrap break-words font-sans text-sm leading-7 [overflow-wrap:anywhere]",
        className,
      )}
    >
      {text}
    </pre>
  );
}

function renderPart(message: AiMessageRecord, part: AiMessagePart, index: number) {
  switch (part.type) {
    case "text":
      return (
        <div
          key={`${message.id}-${part.type}-${index}`}
          className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,30,0.94),rgba(11,14,21,0.94))] px-4 py-3.5 text-white shadow-[0_16px_48px_-36px_rgba(0,0,0,0.9)]"
        >
          {renderTextPart(part.text)}
        </div>
      );
    case "error":
      return (
        <div
          key={`${message.id}-${part.type}-${index}`}
          className="overflow-hidden rounded-[24px] border border-rose-200/70 bg-rose-50/95 px-4 py-3.5 text-rose-950 shadow-sm"
        >
          {renderTextPart(part.message, "text-rose-950")}
        </div>
      );
    case "tool-result":
      return (
        <div key={`${message.id}-${part.type}-${index}`} className="min-w-0">
          <AiToolResultCard part={part} />
        </div>
      );
    case "approval-request":
      return (
        <div key={`${message.id}-${part.type}-${index}`} className="min-w-0">
          <AiApprovalRequestCard threadId={message.threadId} part={part} />
        </div>
      );
    case "coding-prompt":
      return (
        <div key={`${message.id}-${part.type}-${index}`} className="min-w-0">
          <AiCodingPromptCard part={part} />
        </div>
      );
    case "context-chip":
      return (
        <div
          key={`${message.id}-${part.type}-${index}`}
          className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/64"
        >
          {part.label}
        </div>
      );
    case "tool-call":
      return null;
    default:
      return null;
  }
}

export function AiWorkbenchChatMessage({
  message,
  streamingText = "",
}: AiWorkbenchChatMessageProps) {
  const isStreaming = !message;
  const isUser = message?.role === "USER";
  const isSystem = message?.role === "SYSTEM";
  const visibleParts = message
    ? message.parts.filter((part) => part.type !== "tool-call")
    : [];
  const textOnly =
    isStreaming ||
    (visibleParts.length > 0 &&
      visibleParts.every(
        (part) => part.type === "text" || part.type === "error",
      ));

  const widthClassName = isUser
    ? "max-w-[min(82%,44rem)]"
    : textOnly
      ? "max-w-[min(100%,54rem)]"
      : "w-full max-w-[min(100%,58rem)]";

  if (isStreaming) {
    return (
      <div className="flex w-full justify-start">
        <div className={cn("min-w-0", widthClassName)}>
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,30,0.94),rgba(11,14,21,0.94))] px-4 py-3.5 text-white shadow-[0_16px_48px_-36px_rgba(0,0,0,0.9)]">
            {streamingText ? (
              renderTextPart(streamingText)
            ) : (
              <div className="flex items-center gap-2 text-sm text-white/56">
                <LoaderCircle className="size-4 animate-spin" />
                AI 正在整理回复...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex w-full",
        isUser ? "justify-end" : isSystem ? "justify-center" : "justify-start",
      )}
    >
      <div className={cn("min-w-0", widthClassName)}>
        {textOnly ? (
          <div
            className={cn(
              "overflow-hidden rounded-[24px] border px-4 py-3.5 shadow-[0_16px_48px_-36px_rgba(0,0,0,0.9)]",
              isUser &&
                "border-sky-400/30 bg-[linear-gradient(135deg,rgba(35,128,255,0.96),rgba(20,97,210,0.94))] text-white",
              !isUser &&
                !isSystem &&
                "border-white/10 bg-[linear-gradient(180deg,rgba(18,22,30,0.94),rgba(11,14,21,0.94))] text-white",
              isSystem &&
                "border-amber-200/60 bg-amber-50/95 text-amber-950 shadow-sm",
            )}
          >
            <div className="flex min-w-0 flex-col gap-3">
              {visibleParts.length > 0 ? (
                visibleParts.map((part, index) => (
                  <div key={`${message.id}-${part.type}-${index}`} className="min-w-0">
                    {part.type === "error"
                      ? renderTextPart(
                          part.message,
                          isSystem ? "text-amber-950" : "text-rose-100",
                        )
                      : part.type === "text"
                        ? renderTextPart(
                            part.text,
                            isSystem ? "text-amber-950" : undefined,
                          )
                        : null}
                  </div>
                ))
              ) : (
                <p className="text-sm leading-7 text-white/60">
                  暂无可展示的消息内容。
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-3">
            {visibleParts.length > 0 ? (
              visibleParts.map((part, index) => renderPart(message, part, index))
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,30,0.94),rgba(11,14,21,0.94))] px-4 py-3.5 text-sm leading-7 text-white/60">
                暂无可展示的消息内容。
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
