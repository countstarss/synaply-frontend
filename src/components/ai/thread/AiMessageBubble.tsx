"use client";

import { cn } from "@/lib/utils";
import {
  getAiMessageText,
  hasUnsupportedAiParts,
  type AiMessageRecord,
} from "@/lib/ai/types";

interface AiMessageBubbleProps {
  message: AiMessageRecord;
}

export function AiMessageBubble({ message }: AiMessageBubbleProps) {
  const text = getAiMessageText(message.parts);
  const hasUnsupportedParts = hasUnsupportedAiParts(message.parts);
  const isUser = message.role === "USER";
  const isSystem = message.role === "SYSTEM";

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
        isSystem && "justify-center",
      )}
    >
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser && "bg-sky-600 text-white",
          !isUser &&
            !isSystem &&
            "border border-app-border bg-app-content-bg text-app-text-primary",
          isSystem && "border border-amber-200 bg-amber-50 text-amber-900",
        )}
      >
        {text ? (
          <pre className="whitespace-pre-wrap break-words font-sans leading-6">
            {text}
          </pre>
        ) : (
          <p className="leading-6 text-app-text-secondary">
            工具调用 / 审批 / 编码 prompt 留待 Stage 3-5
          </p>
        )}

        {hasUnsupportedParts && text ? (
          <p className="mt-2 text-xs opacity-80">
            这条消息还包含结构化片段，当前版本先显示文本摘要。
          </p>
        ) : null}
      </div>
    </div>
  );
}
