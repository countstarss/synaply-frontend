"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, FolderOpen, MessageSquareText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAiThread } from "@/hooks/useAiThread";
import { useAiThreadStream } from "@/hooks/useAiThreadStream";
import { useIssues } from "@/hooks/useIssueApi";
import { useProjects } from "@/hooks/useProjectApi";
import { useWorkspace } from "@/hooks/useWorkspace";
import { AiWorkbenchSidebar } from "@/components/ai/workbench/modules/sidebar/AiWorkbenchSidebar";
import { AiWorkbenchChatPanel } from "@/components/ai/workbench/modules/chat/AiWorkbenchChatPanel";
import type { AiSurfaceType, AiThreadRecord } from "@/lib/ai/types";
import { createAiThread, listAiThreads } from "@/lib/fetchers/ai-thread";
import { type Issue } from "@/lib/fetchers/issue";
import { cn } from "@/lib/utils";
import { useAiThreadStore } from "@/stores/ai-thread";
import { IssueStateCategory } from "@/types/prisma";
import AmbientGlow from "@/components/global/AmbientGlow";
import { useRouter } from "@/i18n/navigation";

const NONE_VALUE = "__none__";
const panelClassName =
  "rounded-lg border border-black/[0.06] bg-white/84 shadow-[0_24px_72px_-56px_rgba(15,23,42,0.22)] ring-1 ring-black/[0.03] backdrop-blur-2xl dark:border-white/8 dark:bg-[rgba(18,18,20,0.72)] dark:ring-white/[0.04] dark:shadow-[0_24px_72px_-56px_rgba(0,0,0,0.88)]";

function getIssueLabel(issue: Issue) {
  return issue.key ? `${issue.key} · ${issue.title}` : issue.title;
}

function formatRelativeThreadTime(value?: string | null) {
  if (!value) {
    return "刚刚";
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays < 7) {
    return `${diffDays} 天前`;
  }

  return new Date(value).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}

function buildNewThreadTitle(
  workspaceName: string,
  selectedProjectName?: string | null,
  selectedIssueTitle?: string | null,
) {
  if (selectedIssueTitle) {
    return `${selectedIssueTitle} · 新线程`;
  }

  if (selectedProjectName) {
    return `${selectedProjectName} · 新讨论`;
  }

  return `${workspaceName} · 新对话`;
}

function getThreadContextLabel(
  thread: AiThreadRecord,
  issueMap: Map<string, Issue>,
  projectNameMap: Map<string, string>,
  workspaceName: string,
) {
  if (
    thread.originSurfaceType === "ISSUE" &&
    thread.originSurfaceId &&
    issueMap.has(thread.originSurfaceId)
  ) {
    return getIssueLabel(issueMap.get(thread.originSurfaceId)!);
  }

  if (
    thread.originSurfaceType === "PROJECT" &&
    thread.originSurfaceId &&
    projectNameMap.has(thread.originSurfaceId)
  ) {
    return projectNameMap.get(thread.originSurfaceId)!;
  }

  return `${workspaceName} · 自由对话`;
}

function getAiThreadPath(threadId: string) {
  return `/ai/${encodeURIComponent(threadId)}`;
}

function getSelectionFromThread(
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

export function AiWorkbenchPage() {
  const params = useParams<{ threadId?: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { currentWorkspace, loading: isWorkspaceLoading } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const activeThreadId =
    typeof params.threadId === "string" ? params.threadId : null;

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isStreaming, streamingText, error, setError } = useAiThreadStore();

  const { data: projects = [], isLoading: isProjectsLoading } =
    useProjects(workspaceId);
  const { data: allIssues = [], isLoading: isIssuesLoading } = useIssues(
    workspaceId,
    { limit: 200 },
    { enabled: !!workspaceId },
  );
  const threadsQuery = useQuery({
    queryKey: ["ai-threads", workspaceId],
    queryFn: async () => {
      if (!session?.access_token || !workspaceId) {
        return [];
      }

      return listAiThreads(workspaceId, session.access_token);
    },
    enabled: !!session?.access_token && !!workspaceId,
  });

  const localSelectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  );
  const issueMap = useMemo(
    () => new Map(allIssues.map((issue) => [issue.id, issue])),
    [allIssues],
  );
  const projectNameMap = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );
  const localCandidateIssues = useMemo(
    () =>
      allIssues
        .filter(
          (issue) =>
            (!selectedProjectId || issue.projectId === selectedProjectId) &&
            issue.state?.category !== IssueStateCategory.DONE &&
            issue.state?.category !== IssueStateCategory.CANCELED,
        )
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime(),
        ),
    [allIssues, selectedProjectId],
  );
  const projectIdSet = useMemo(
    () => new Set(projects.map((project) => project.id)),
    [projects],
  );
  const localCandidateIssueIdSet = useMemo(
    () => new Set(localCandidateIssues.map((issue) => issue.id)),
    [localCandidateIssues],
  );
  const sortedThreads = useMemo(
    () =>
      [...(threadsQuery.data || [])].sort((left, right) => {
        const leftValue = left.lastMessageAt || left.updatedAt || left.createdAt;
        const rightValue =
          right.lastMessageAt || right.updatedAt || right.createdAt;
        return new Date(rightValue).getTime() - new Date(leftValue).getTime();
      }),
    [threadsQuery.data],
  );

  useEffect(() => {
    if (activeThreadId) {
      return;
    }

    if (isProjectsLoading || !selectedProjectId) {
      return;
    }

    if (!projectIdSet.has(selectedProjectId)) {
      setSelectedProjectId("");
      setSelectedIssueId("");
    }
  }, [activeThreadId, isProjectsLoading, projectIdSet, selectedProjectId]);

  useEffect(() => {
    if (activeThreadId) {
      return;
    }

    if (isIssuesLoading) {
      return;
    }

    if (!selectedProjectId) {
      if (selectedIssueId) {
        setSelectedIssueId("");
      }

      return;
    }

    if (selectedIssueId && !localCandidateIssueIdSet.has(selectedIssueId)) {
      setSelectedIssueId("");
    }
  }, [
    activeThreadId,
    isIssuesLoading,
    localCandidateIssueIdSet,
    selectedIssueId,
    selectedProjectId,
  ]);

  const localSelectedIssue =
    localCandidateIssues.find((issue) => issue.id === selectedIssueId) ||
    issueMap.get(selectedIssueId);
  const originSurfaceType: AiSurfaceType = localSelectedIssue
    ? "ISSUE"
    : localSelectedProject
      ? "PROJECT"
      : "WORKSPACE";
  const originSurfaceId =
    localSelectedIssue?.id || localSelectedProject?.id || workspaceId;
  const originTitle =
    localSelectedIssue?.title ||
    localSelectedProject?.name ||
    (currentWorkspace ? `${currentWorkspace.name} · AI 工作台` : "AI 工作台");

  const {
    thread,
    threadId,
    messages,
    isLoading,
    ensureThread,
  } = useAiThread({
    workspaceId,
    originSurfaceType,
    originSurfaceId,
    originTitle,
    enabled: !!workspaceId && !!originSurfaceId,
    autoCreate: false,
    threadIdOverride: activeThreadId,
  });
  const { sendMessage } = useAiThreadStream({
    workspaceId,
    threadId,
  });

  const resolvedThread =
    thread || sortedThreads.find((item) => item.id === activeThreadId) || null;
  const threadSelection =
    activeThreadId && resolvedThread
      ? getSelectionFromThread(resolvedThread, issueMap)
      : null;
  const displayProjectId = threadSelection?.projectId ?? selectedProjectId;
  const displayIssueId = threadSelection?.issueId ?? selectedIssueId;
  const displaySelectedProject = projects.find(
    (project) => project.id === displayProjectId,
  );
  const displayCandidateIssues = useMemo(
    () =>
      allIssues
        .filter(
          (issue) =>
            (!displayProjectId || issue.projectId === displayProjectId) &&
            issue.state?.category !== IssueStateCategory.DONE &&
            issue.state?.category !== IssueStateCategory.CANCELED,
        )
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime(),
        ),
    [allIssues, displayProjectId],
  );
  const displayCandidateIssueIdSet = useMemo(
    () => new Set(displayCandidateIssues.map((issue) => issue.id)),
    [displayCandidateIssues],
  );
  const projectSelectValue =
    displayProjectId && projectIdSet.has(displayProjectId)
      ? displayProjectId
      : NONE_VALUE;
  const issueSelectValue =
    displayIssueId && displayCandidateIssueIdSet.has(displayIssueId)
      ? displayIssueId
      : NONE_VALUE;
  const displaySelectedIssue =
    displayCandidateIssues.find((issue) => issue.id === displayIssueId) ||
    issueMap.get(displayIssueId);
  const createThreadOriginSurfaceType: AiSurfaceType = displaySelectedIssue
    ? "ISSUE"
    : displaySelectedProject
      ? "PROJECT"
      : "WORKSPACE";
  const createThreadOriginSurfaceId =
    displaySelectedIssue?.id || displaySelectedProject?.id || workspaceId;

  const createThreadMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token || !workspaceId || !currentWorkspace) {
        throw new Error("当前还不能创建 AI 线程");
      }

      return createAiThread(workspaceId, session.access_token, {
        title: buildNewThreadTitle(
          currentWorkspace.name,
          displaySelectedProject?.name,
          displaySelectedIssue?.title,
        ),
        originSurfaceType: createThreadOriginSurfaceType,
        originSurfaceId: createThreadOriginSurfaceId,
      });
    },
    onSuccess: async (createdThread) => {
      router.push(getAiThreadPath(createdThread.id));
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: ["ai-threads", workspaceId],
      });
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "创建 AI 线程失败",
      );
    },
  });

  const currentContextBadges = [
    {
      key: "workspace",
      label: currentWorkspace?.name || "未命名 workspace",
      tone: "workspace",
    },
    displaySelectedProject
      ? {
          key: "project",
          label: displaySelectedProject.name,
          tone: "project",
        }
      : null,
    displaySelectedIssue
      ? {
          key: "issue",
          label: getIssueLabel(displaySelectedIssue),
          tone: "issue",
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    tone: "workspace" | "project" | "issue";
  }>;

  const sidebarProjects = useMemo(
    () =>
      [...projects].sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      ),
    [projects],
  );

  const contextSummary = displaySelectedIssue
    ? "围绕具体 issue 深入讨论拆解、风险、依赖与下一步执行。"
    : displaySelectedProject
      ? "围绕项目范围与优先级推进，让 AI 帮你继续拆出可执行 issue。"
      : "从一个模糊想法开始，把讨论逐步收束成项目、issue 与后续动作。";

  const applyThreadSelection = (targetThread: AiThreadRecord) => {
    router.push(getAiThreadPath(targetThread.id));
  };

  const handleProjectSelection = (value: string) => {
    if (activeThreadId) {
      router.push("/ai");
    }

    const nextProjectId = value === NONE_VALUE ? "" : value;
    setSelectedProjectId(nextProjectId);
    if (!nextProjectId) {
      setSelectedIssueId("");
    }
  };

  const handleIssueSelection = (value: string) => {
    if (activeThreadId) {
      router.push("/ai");
    }

    setSelectedIssueId(value === NONE_VALUE ? "" : value);
  };

  const handleStartNewThread = async () => {
    await createThreadMutation.mutateAsync();
  };

  const handleSend = async () => {
    const trimmedText = draft.trim();

    if (!trimmedText || !workspaceId || !originSurfaceId) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const ensuredThreadId = activeThreadId || (await ensureThread());
      await sendMessage(trimmedText, ensuredThreadId);
      if (activeThreadId !== ensuredThreadId) {
        router.push(getAiThreadPath(ensuredThreadId));
      }
      setDraft("");
      await queryClient.invalidateQueries({
        queryKey: ["ai-threads", workspaceId],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isWorkspaceLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-app-text-secondary">
        正在准备 AI 工作台...
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-app-text-secondary">
        还没有可用的 workspace，暂时无法启动 AI。
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-full overflow-hidden bg-app-bg text-app-text-primary">
      <AmbientGlow className="opacity-0 dark:opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.6),rgba(241,245,249,0.92))] dark:bg-[linear-gradient(180deg,rgba(12,12,14,0.14),rgba(12,12,14,0.46))]" />

      <div className="relative z-10 flex h-full min-h-0 gap-2">
        <AiWorkbenchSidebar
          workspaceName={currentWorkspace.name}
          threads={sortedThreads}
          resolvedThreadId={resolvedThread?.id ?? null}
          projectOptions={sidebarProjects.map((project) => ({
            id: project.id,
            name: project.name,
          }))}
          issueOptions={displayCandidateIssues}
          issueMap={issueMap}
          projectNameMap={projectNameMap}
          projectSelectValue={projectSelectValue}
          issueSelectValue={issueSelectValue}
          noneValue={NONE_VALUE}
          currentProject={displaySelectedProject ?? null}
          currentIssue={displaySelectedIssue ?? null}
          contextSummary={contextSummary}
          isProjectsLoading={isProjectsLoading}
          isIssuesLoading={isIssuesLoading}
          issueSelectDisabled={
            projectSelectValue === NONE_VALUE || displayCandidateIssues.length === 0
          }
          isCreatingThread={createThreadMutation.isPending}
          onProjectChange={handleProjectSelection}
          onIssueChange={handleIssueSelection}
          onResetContext={() => {
            router.push("/ai");
            setSelectedProjectId("");
            setSelectedIssueId("");
          }}
          onStartNewThread={handleStartNewThread}
          onSelectThread={applyThreadSelection}
        />

        <main className={cn(panelClassName, "min-w-0 flex-1 overflow-hidden")}>
          <div className="flex h-full min-h-0 flex-col">
            <header className="border-b border-black/[0.06] px-5 py-5 dark:border-white/8">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-slate-950 dark:text-white">
                    {resolvedThread?.title || originTitle}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {currentContextBadges.map((item) => (
                    <span
                      key={item.key}
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-black/[0.06] bg-black/[0.03] px-3 py-1 text-xs text-slate-600 dark:border-white/8 dark:bg-white/[0.04] dark:text-white/62"
                    >
                      {item.tone === "project" ? (
                        <FolderOpen className="size-3.5" />
                      ) : item.tone === "issue" ? (
                        <MessageSquareText className="size-3.5" />
                      ) : (
                        <Bot className="size-3.5" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </header>

            <div className="min-h-0 flex-1">
              <AiWorkbenchChatPanel
                messages={messages}
                draft={draft}
                onDraftChange={setDraft}
                onPrefillSuggestion={setDraft}
                onSend={handleSend}
                isLoading={isLoading && messages.length === 0}
                isStreaming={isStreaming}
                streamingText={streamingText}
                disabled={
                  isSubmitting ||
                  createThreadMutation.isPending ||
                  !workspaceId ||
                  !originSurfaceId
                }
                isSubmitting={isSubmitting}
                error={error}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
