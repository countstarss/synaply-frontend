"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  FolderOpen,
  MessageSquareText,
  Plus,
} from "lucide-react";
import { RiSendPlane2Line } from "react-icons/ri";
import { useAuth } from "@/context/AuthContext";
import { AiMessageList } from "@/components/ai/thread/AiMessageList";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAiThread } from "@/hooks/useAiThread";
import { useAiThreadStream } from "@/hooks/useAiThreadStream";
import { useIssues } from "@/hooks/useIssueApi";
import { useProjects } from "@/hooks/useProjectApi";
import { useWorkspace } from "@/hooks/useWorkspace";
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
  "rounded-[28px] border border-white/8 bg-[rgba(11,14,20,0.62)] shadow-[0_24px_72px_-56px_rgba(2,8,23,0.9)] backdrop-blur-2xl";

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
      <AmbientGlow className="opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(6,8,12,0.18),rgba(6,8,12,0.58))]" />

      <div className="relative z-10 flex h-full min-h-0 gap-3 p-3">
        <aside className={cn(panelClassName, "flex w-[304px] shrink-0 flex-col overflow-hidden")}>
          <div className="border-b border-white/8 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-semibold text-white">
                  AI Workbench
                </h1>
                <p className="mt-1 truncate text-sm text-white/44">
                  {currentWorkspace.name}
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                className="h-9 rounded-xl bg-white/92 px-3 text-slate-950 hover:bg-white"
                disabled={createThreadMutation.isPending}
                onClick={() => void handleStartNewThread()}
              >
                <Plus className="mr-1 size-4" />
                新建
              </Button>
            </div>
          </div>

          <div className="border-b border-white/8 px-4 py-4">
            <div className="space-y-3">
              <Select
                value={projectSelectValue}
                onValueChange={handleProjectSelection}
              >
                <SelectTrigger className="h-10 rounded-xl border-white/8 bg-white/[0.03] text-white shadow-none">
                  <SelectValue
                    placeholder={
                      isProjectsLoading ? "正在加载项目..." : "选择项目"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={NONE_VALUE}>直接从想法开始</SelectItem>
                    {sidebarProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Select
                value={issueSelectValue}
                onValueChange={handleIssueSelection}
                disabled={
                  projectSelectValue === NONE_VALUE ||
                  displayCandidateIssues.length === 0
                }
              >
                <SelectTrigger className="h-10 rounded-xl border-white/8 bg-white/[0.03] text-white shadow-none">
                  <SelectValue
                    placeholder={
                      isIssuesLoading
                        ? "正在加载 issue..."
                        : projectSelectValue !== NONE_VALUE
                          ? "选择 issue"
                          : "先选择项目"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={NONE_VALUE}>只围绕当前项目来聊</SelectItem>
                    {displayCandidateIssues.map((issue) => (
                      <SelectItem key={issue.id} value={issue.id}>
                        {getIssueLabel(issue)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-3 py-3">
              <button
                type="button"
                onClick={() => {
                  router.push("/ai");
                  setSelectedProjectId("");
                  setSelectedIssueId("");
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                  projectSelectValue === NONE_VALUE
                    ? "bg-white/[0.08] text-white"
                    : "text-white/72 hover:bg-white/[0.05] hover:text-white",
                )}
              >
                <Bot className="size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">从想法开始</p>
                  <p className="truncate text-xs text-white/36">不预设上下文</p>
                </div>
              </button>

              <div className="mt-4 px-2 text-[11px] font-medium text-white/28">
                最近线程
              </div>

              <div className="mt-2 space-y-1">
                {sortedThreads.length === 0 ? (
                  <div className="px-3 py-6 text-sm leading-6 text-white/40">
                    还没有历史线程。先发一条消息，这里会开始沉淀记录。
                  </div>
                ) : (
                  sortedThreads.map((item) => {
                    const active = resolvedThread?.id === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => applyThreadSelection(item)}
                        className={cn(
                          "w-full rounded-2xl px-3 py-2.5 text-left transition",
                          active
                            ? "bg-white/[0.08]"
                            : "hover:bg-white/[0.05]",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {item.title || "AI 协作线程"}
                            </p>
                            <p className="mt-1 truncate text-xs text-white/34">
                              {getThreadContextLabel(
                                item,
                                issueMap,
                                projectNameMap,
                                currentWorkspace.name,
                              )}
                            </p>
                          </div>
                          <span className="shrink-0 text-[11px] text-white/24">
                            {formatRelativeThreadTime(
                              item.lastMessageAt || item.updatedAt,
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </ScrollArea>
        </aside>

        <main className={cn(panelClassName, "min-w-0 flex-1 overflow-hidden")}>
          <div className="flex h-full min-h-0 flex-col">
            <header className="border-b border-white/8 px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-white">
                    {resolvedThread?.title || originTitle}
                  </h2>
                  <p className="mt-1 truncate text-sm text-white/42">
                    {contextSummary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {currentContextBadges.map((item) => (
                    <span
                      key={item.key}
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-white/62"
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
              <div className="mx-auto flex h-full w-full max-w-4xl min-w-0">
                <AiMessageList
                  messages={messages}
                  isLoading={isLoading && messages.length === 0}
                  isStreaming={isStreaming}
                  streamingText={streamingText}
                />
              </div>
            </div>

            <div className="border-t border-white/8 px-4 py-4">
              <div className="mx-auto max-w-4xl rounded-[24px] border border-white/8 bg-black/10 px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          void handleSend();
                        }
                      }}
                      placeholder="直接说你的想法，或者告诉 AI 现在想推进哪个项目 / issue。"
                      className="min-h-24 resize-none border-0 bg-transparent px-0 text-[15px] leading-7 text-white placeholder:text-white/28 shadow-none focus-visible:ring-0"
                    />
                  </div>

                  <Button
                    type="button"
                    disabled={
                      !draft.trim() ||
                      isSubmitting ||
                      createThreadMutation.isPending ||
                      !workspaceId ||
                      !originSurfaceId
                    }
                    className="h-10 rounded-xl bg-white/92 px-4 text-slate-950 hover:bg-white"
                    onClick={() => void handleSend()}
                  >
                    <RiSendPlane2Line className="mr-2 size-4" />
                    发送
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
                  <p className="text-xs text-white/34">
                    当前会写入 AI thread / runs / steps。后续接入 execution 后再补确认执行。
                  </p>
                  {error ? (
                    <span className="max-w-sm text-right text-xs leading-6 text-amber-200/90">
                      {error}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
