"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  RiAddLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiLoader4Line,
  RiLoopLeftLine,
  RiTimeLine,
} from "react-icons/ri";
import DocsPage from "@/components/shared/docs/DocsPage";
import {
  IssueViewModeToggle,
  type IssueViewMode,
} from "@/components/issue/IssueViewModeToggle";
import { ProjectIssuesKanbanBoard } from "@/components/projects/ProjectIssuesKanbanBoard";
import { useIssueStates } from "@/hooks/useIssueStates";
import { useUpdateIssue } from "@/hooks/useIssueApi";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  buildIssueStateSummary,
  resolveIssueStateForCategory,
  sortIssuesByUrgency,
} from "@/lib/issue-board";
import type { Issue } from "@/lib/fetchers/issue";
import type {
  Project,
  ProjectActivityItem,
  ProjectDetail,
  ProjectWorkflowSummary,
} from "@/lib/fetchers/project";
import { formatShortDate, getIssueStateMeta, getPriorityTone } from "@/components/projects/project-view-utils";
import { IssueStateCategory } from "@/types/prisma";

type OptimisticIssueState = Pick<Issue, "state" | "stateId">;

function formatRelativeTime(date: string) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / (1000 * 60)), 0);

  if (diffMinutes < 1) {
    return "刚刚";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} 天前`;
  }

  return formatShortDate(date);
}

function ProjectSurfaceCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-app-border bg-app-content-bg/95 shadow-sm",
        className,
      )}
    >
      <div className="shrink-0 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-app-text-primary">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-xs leading-5 text-app-text-secondary">
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </div>
      </div>
      <div className="min-h-0 flex-1 px-5 pb-5">{children}</div>
    </section>
  );
}

function ProjectIssueList({
  issues,
  onOpenIssue,
}: {
  issues: Issue[];
  onOpenIssue: (issue: Issue) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-app-border bg-app-content-bg">
      {issues.map((issue) => {
        const priorityMeta = getPriorityTone(issue);
        const stateMeta = getIssueStateMeta(issue);

        return (
          <button
            key={issue.id}
            type="button"
            onClick={() => onOpenIssue(issue)}
            className="group flex w-full items-center gap-4 border-b border-app-border px-4 py-3 text-left transition last:border-b-0 hover:bg-app-button-hover/35  cursor-pointer"
          >
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border border-app-border bg-app-bg",
                stateMeta.className,
              )}
            >
              {stateMeta.icon}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-app-text-muted">
                  {issue.key || issue.id.slice(0, 8)}
                </span>
                <span className="truncate text-sm text-app-text-primary">
                  {issue.title}
                </span>
              </div>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              {issue.dueDate && (
                <b className="text-bold text-xs text-white/80">
                  {formatShortDate(issue.dueDate)}
                </b>
              )}
              <span className="text-xs text-app-text-muted">
                {stateMeta.label}
              </span>
              {priorityMeta && (
                <span
                  className={cn(
                    "rounded-full border px-2 py-1 text-[11px]",
                    priorityMeta.color,
                  )}
                >
                  {priorityMeta.label}
                </span>
              )}
            </div>

            <RiArrowRightSLine className="size-4 shrink-0 text-app-text-muted transition group-hover:translate-x-0.5 group-hover:text-app-text-primary" />
          </button>
        );
      })}
    </div>
  );
}

export function ProjectIssuesSubview({
  workspaceId,
  projectIssues,
  issuesViewMode,
  issueBoardCategoryOrder,
  isLoadingProjectIssues,
  hasUnsavedIssueBoardCategoryOrder,
  onCreateIssue,
  onOpenIssue,
  onIssueBoardCategoryOrderChange,
  onSaveIssueBoardCategoryOrder,
  onIssuesViewModeChange,
}: {
  workspaceId: string;
  projectIssues: Issue[];
  issuesViewMode: IssueViewMode;
  issueBoardCategoryOrder: IssueStateCategory[];
  isLoadingProjectIssues: boolean;
  hasUnsavedIssueBoardCategoryOrder: boolean;
  onCreateIssue: () => void;
  onOpenIssue: (issue: Issue) => void;
  onIssueBoardCategoryOrderChange: (order: IssueStateCategory[]) => void;
  onSaveIssueBoardCategoryOrder: () => void;
  onIssuesViewModeChange: (viewMode: IssueViewMode) => void;
}) {
  const { data: issueStates = [] } = useIssueStates(workspaceId, {
    enabled: !!workspaceId,
  });
  const updateIssueMutation = useUpdateIssue();
  const [optimisticIssueStates, setOptimisticIssueStates] = useState<
    Record<string, OptimisticIssueState>
  >({});
  const [pendingIssueIds, setPendingIssueIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setOptimisticIssueStates({});
    setPendingIssueIds(new Set());
  }, [projectIssues, workspaceId]);

  useEffect(() => {
    setOptimisticIssueStates((current) => {
      let hasChanged = false;
      const nextState = { ...current };

      for (const issue of projectIssues) {
        const optimisticState = current[issue.id];

        if (!optimisticState) {
          continue;
        }

        if (issue.stateId === optimisticState.stateId) {
          delete nextState[issue.id];
          hasChanged = true;
        }
      }

      return hasChanged ? nextState : current;
    });
  }, [projectIssues]);

  const displayedIssues = useMemo(
    () =>
      sortIssuesByUrgency(
        projectIssues.map((issue) => {
          const optimisticState = optimisticIssueStates[issue.id];

          if (!optimisticState) {
            return issue;
          }

          return {
            ...issue,
            stateId: optimisticState.stateId,
            state: optimisticState.state,
          };
        }),
      ),
    [optimisticIssueStates, projectIssues],
  );

  const handleMoveIssueToCategory = (
    issue: Issue,
    nextCategory: IssueStateCategory,
  ) => {
    if (!workspaceId) {
      return;
    }

    if (pendingIssueIds.has(issue.id)) {
      return;
    }

    const targetState = resolveIssueStateForCategory(issueStates, nextCategory);

    if (!targetState || issue.stateId === targetState.id) {
      return;
    }

    setOptimisticIssueStates((current) => ({
      ...current,
      [issue.id]: {
        stateId: targetState.id,
        state: buildIssueStateSummary(targetState),
      },
    }));
    setPendingIssueIds((current) => {
      const nextState = new Set(current);
      nextState.add(issue.id);
      return nextState;
    });

    updateIssueMutation.mutate(
      {
        workspaceId,
        issueId: issue.id,
        data: {
          stateId: targetState.id,
        },
      },
      {
        onSuccess: () => {
          setPendingIssueIds((current) => {
            const nextState = new Set(current);
            nextState.delete(issue.id);
            return nextState;
          });
        },
        onError: () => {
          setOptimisticIssueStates((current) => {
            const nextState = { ...current };
            delete nextState[issue.id];
            return nextState;
          });
          setPendingIssueIds((current) => {
            const nextState = new Set(current);
            nextState.delete(issue.id);
            return nextState;
          });
        },
      },
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col p-4">
      <ProjectSurfaceCard
        title="Issues"
        subtitle="把项目执行层单独沉到一层，保留现有 list / board 双视图。"
        action={
          <button
            onClick={onCreateIssue}
            className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary transition hover:bg-app-button-hover"
          >
            <RiAddLine className="size-4" />
            新建 Issue
          </button>
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 pb-4">
            <div className="text-xs text-app-text-secondary">
              {displayedIssues.length} 条项目任务
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {issuesViewMode === "board" && (
                <button
                  type="button"
                  onClick={onSaveIssueBoardCategoryOrder}
                  className={cn(
                    "inline-flex h-8 items-center rounded-xl border px-3 text-xs font-medium transition",
                    hasUnsavedIssueBoardCategoryOrder
                      ? "border-sky-500/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
                      : "border-app-border bg-app-bg text-app-text-secondary hover:bg-app-button-hover",
                  )}
                >
                  {hasUnsavedIssueBoardCategoryOrder ? "保存看板顺序" : "已保存顺序"}
                </button>
              )}
              <IssueViewModeToggle
                value={issuesViewMode}
                onValueChange={onIssuesViewModeChange}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1">
            {isLoadingProjectIssues ? (
              <div className="flex h-full items-center justify-center px-6 text-app-text-secondary">
                <RiLoader4Line className="mr-2 size-5 animate-spin" />
                正在加载项目任务...
              </div>
            ) : displayedIssues.length === 0 ? (
              <div className="flex h-full items-center justify-center overflow-y-auto px-2">
                <div className="w-full h-full rounded-2xl border border-dashed border-app-border bg-app-bg p-6 text-center">
                  <div className="text-base font-semibold text-app-text-primary">
                    这个项目还没有任务
                  </div>
                  <div className="mt-2 text-sm text-app-text-secondary">
                    可以先创建一条 issue 放进这个项目里。
                  </div>
                  <button
                    onClick={onCreateIssue}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                  >
                    <RiAddLine className="size-4" />
                    创建项目任务
                  </button>
                </div>
              </div>
            ) : issuesViewMode === "board" ? (
              <ProjectIssuesKanbanBoard
                issues={displayedIssues}
                categoryOrder={issueBoardCategoryOrder}
                pendingIssueIds={pendingIssueIds}
                onOpenIssue={onOpenIssue}
                onCategoryOrderChange={onIssueBoardCategoryOrderChange}
                onMoveIssue={handleMoveIssueToCategory}
              />
            ) : (
              <div className="h-full overflow-y-auto scrollbar-hidden">
                <ProjectIssueList
                  issues={displayedIssues}
                  onOpenIssue={onOpenIssue}
                />
              </div>
            )}
          </div>
        </div>
      </ProjectSurfaceCard>
    </div>
  );
}

export function ProjectDocsSubview({
  workspaceId,
  workspaceType,
  currentUserId,
  projectId,
}: {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  currentUserId?: string;
  projectId: string;
}) {
  if (!currentUserId) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-8">
        <div className="rounded-2xl border border-dashed border-app-border bg-app-content-bg/95 px-6 py-10 text-center text-sm text-app-text-secondary">
          当前用户信息不可用，暂时无法加载项目文档。
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      <div className="h-full overflow-hidden rounded-[28px] border border-app-border bg-app-content-bg/95 shadow-sm">
        <DocsPage
          workspaceId={workspaceId}
          workspaceType={workspaceType}
          userId={currentUserId}
          context={workspaceType === "PERSONAL" ? "personal" : "team"}
          projectId={projectId}
        />
      </div>
    </div>
  );
}

export function ProjectWorkflowSubview({
  relatedWorkflows,
}: {
  relatedWorkflows: ProjectWorkflowSummary[];
}) {
  return (
    <div className="flex h-full min-h-0 flex-col p-4">
      <ProjectSurfaceCard
        title="Workflow"
        subtitle="这里聚合当前项目真实关联的流程，不再埋在项目总览中间。"
        action={
          <Link
            href="/workflows"
            className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-bg px-3 py-1 text-xs text-app-text-primary transition hover:bg-app-button-hover"
          >
            打开工作流中心
            <RiArrowRightLine className="size-3.5" />
          </Link>
        }
      >
        {relatedWorkflows.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-bg/60 px-4 py-8 text-sm text-app-text-secondary">
            当前项目还没有关联 workflow issue。把流程型 Issue 归到此项目后，这里会自动聚合。
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {relatedWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-app-text-primary">
                        {workflow.name}
                      </div>
                      <div className="mt-1 text-xs text-app-text-secondary">
                        {workflow.issueCount} 个关联 issue · {workflow.status}
                      </div>
                    </div>
                    <div className="rounded-full border border-app-border bg-app-content-bg px-2 py-1 text-[11px] text-app-text-secondary">
                      {workflow.totalSteps} steps
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-app-text-secondary">
                    <div className="rounded-xl border border-app-border bg-app-content-bg/80 px-3 py-2">
                      版本 · {workflow.version || "N/A"}
                    </div>
                    <div className="rounded-xl border border-app-border bg-app-content-bg/80 px-3 py-2">
                      可见性 · {workflow.visibility}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ProjectSurfaceCard>
    </div>
  );
}

export function ProjectSyncSubview({
  selectedProject,
  recentActivity,
  projectIssues,
  onMarkSync,
  isMarkingSync = false,
  onOpenIssue,
}: {
  selectedProject: Project | ProjectDetail;
  recentActivity: ProjectActivityItem[];
  projectIssues: Issue[];
  onMarkSync: () => void;
  isMarkingSync?: boolean;
  onOpenIssue: (issue: Issue) => void;
}) {
  const projectIssueMap = useMemo(
    () =>
      new Map<string, Issue>(projectIssues.map((issue) => [issue.id, issue])),
    [projectIssues],
  );

  return (
    <div className="flex h-full min-h-0 flex-col p-4">
      <ProjectSurfaceCard
        title="Project Sync"
        subtitle="把异步同步痕迹和近期变更沉到单独一层，阅读时不被其他模块打断。"
        action={
          <button
            type="button"
            onClick={onMarkSync}
            disabled={isMarkingSync}
            className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-bg px-3 py-1 text-xs text-app-text-primary transition hover:bg-app-button-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMarkingSync ? (
              <RiLoader4Line className="size-3.5 animate-spin" />
            ) : (
              <RiLoopLeftLine className="size-3.5" />
            )}
            更新同步时间
          </button>
        }
      >
        <div className="flex h-full min-h-0 flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-3">
              <div className="text-xs text-app-text-muted">最近同步</div>
              <div className="mt-2 text-lg font-semibold text-app-text-primary">
                {selectedProject.lastSyncAt
                  ? formatRelativeTime(selectedProject.lastSyncAt)
                  : "未记录"}
              </div>
            </div>
            <div className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-3">
              <div className="text-xs text-app-text-muted">活动数量</div>
              <div className="mt-2 text-lg font-semibold text-app-text-primary">
                {recentActivity.length}
              </div>
            </div>
            <div className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-3">
              <div className="text-xs text-app-text-muted">项目更新时间</div>
              <div className="mt-2 text-lg font-semibold text-app-text-primary">
                {formatRelativeTime(selectedProject.updatedAt)}
              </div>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-bg/60 px-4 py-8 text-sm text-app-text-secondary">
              项目活动流还没有积累起来。Issue 上的步骤推进和活动记录会自动沉淀到这里。
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid gap-2 lg:grid-cols-2">
                {recentActivity.map((activity) => {
                  const issue = activity.issue
                    ? projectIssueMap.get(activity.issue.id)
                    : null;

                  return (
                    <div
                      key={activity.id}
                      className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-3"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-app-text-primary">
                        <RiTimeLine className="size-4 text-app-text-muted" />
                        {activity.action}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-app-text-secondary">
                        {(activity.actor?.user?.name ||
                          activity.actor?.user?.email ||
                          "团队成员") +
                          " · " +
                          formatRelativeTime(activity.createdAt)}
                      </div>
                      {issue && (
                        <button
                          type="button"
                          onClick={() => onOpenIssue(issue)}
                          className="mt-2 inline-flex items-center gap-1 text-xs text-sky-300 transition hover:text-sky-200"
                        >
                          {issue.key || issue.id.slice(0, 4)} · {issue.title}
                          <RiArrowRightSLine className="size-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ProjectSurfaceCard>
    </div>
  );
}
