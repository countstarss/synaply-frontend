"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { AiCodingPromptPart } from "@/lib/ai/types";

interface AiCodingPromptCardProps {
  part: AiCodingPromptPart;
}

export function AiCodingPromptCard({ part }: AiCodingPromptCardProps) {
  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(part.prompt);
      toast.success("编码交接 Prompt 已复制。");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "复制失败");
    }
  };

  return (
    <div className="rounded-2xl border border-app-border bg-app-content-bg p-4 text-sm text-app-text-primary shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">编码交接 Prompt</p>
          <p className="mt-1 text-xs text-app-text-secondary">
            {part.issueId ? `Issue ${part.issueId}` : "未绑定具体 Issue"}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-app-border bg-transparent text-app-text-primary"
          onClick={() => void copyPrompt()}
        >
          复制给 Claude Code / Codex
        </Button>
      </div>

      <pre className="mt-3 max-h-80 overflow-auto rounded-xl border border-app-border bg-app-bg p-3 text-xs leading-6 text-app-text-secondary">
        {part.prompt}
      </pre>
    </div>
  );
}
