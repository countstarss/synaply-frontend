"use client";

import { Badge } from "@/components/ui/badge";
import type { AiThreadRecord } from "@/lib/ai/types";

interface AiThreadListProps {
  thread: AiThreadRecord | null | undefined;
  fallbackTitle?: string | null;
  isLoading?: boolean;
}

export function AiThreadList({
  thread,
  fallbackTitle,
  isLoading = false,
}: AiThreadListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 w-32 animate-pulse rounded bg-app-button-hover" />
        <div className="h-4 w-48 animate-pulse rounded bg-app-button-hover" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-app-text-primary">
          {thread?.title || fallbackTitle || "AI 协作线程"}
        </p>
        <p className="mt-1 text-xs text-app-text-secondary">
          这条线程会记住当前任务上下文和你们的协作记录。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(thread?.pins.length ?? 0) > 0 ? (
          thread?.pins.map((pin) => (
            <Badge
              key={pin.id}
              variant="secondary"
              className="bg-app-button-hover text-app-text-primary"
            >
              {pin.surfaceType} · {pin.surfaceId.slice(0, 8)}
            </Badge>
          ))
        ) : (
          <Badge
            variant="secondary"
            className="bg-app-button-hover text-app-text-secondary"
          >
            暂无上下文 pin
          </Badge>
        )}
      </div>
    </div>
  );
}
