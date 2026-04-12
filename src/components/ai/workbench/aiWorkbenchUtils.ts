"use client";

import type { AiThreadRecord } from "@/lib/ai/types";
import type { Issue } from "@/lib/fetchers/issue";

export function getIssueLabel(issue: Issue) {
  return issue.key ? `${issue.key} · ${issue.title}` : issue.title;
}

export function buildDraftThreadTitle(text: string, maxLength = 80) {
  const normalizedText = text.replace(/\s+/g, " ").trim();

  if (!normalizedText) {
    return "新对话";
  }

  if (normalizedText.length <= maxLength) {
    return normalizedText;
  }

  return normalizedText.slice(0, maxLength).trimEnd();
}

export function getAiThreadPath(threadId: string) {
  return `/intelligence/${encodeURIComponent(threadId)}`;
}

export function getAiComposePath(
  projectId?: string | null,
  issueId?: string | null,
) {
  const searchParams = new URLSearchParams();

  if (projectId) {
    searchParams.set("projectId", projectId);
  }

  if (issueId) {
    searchParams.set("issueId", issueId);
  }

  const query = searchParams.toString();

  return query ? `/intelligence?${query}` : "/intelligence";
}

export function getAiThreadDisplayTitle(title?: string | null) {
  const normalizedTitle = title?.trim();

  if (!normalizedTitle || normalizedTitle === "AI 协作线程") {
    return "Intelligence 对话";
  }

  return normalizedTitle.replace(/ · AI 助手$/u, " · Intelligence");
}

export function getSelectionFromThread(
  thread: AiThreadRecord,
  issueMap: Map<string, Issue>,
) {
  if (thread.originSurfaceType === "ISSUE" && thread.originSurfaceId) {
    const issue = issueMap.get(thread.originSurfaceId);

    return {
      projectId: issue?.projectId || "",
      issueId: thread.originSurfaceId,
    };
  }

  if (thread.originSurfaceType === "PROJECT" && thread.originSurfaceId) {
    return {
      projectId: thread.originSurfaceId,
      issueId: "",
    };
  }

  return {
    projectId: "",
    issueId: "",
  };
}
