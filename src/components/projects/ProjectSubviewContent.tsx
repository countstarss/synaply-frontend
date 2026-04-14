"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  RiAddLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiLoader4Line,
  RiLoopLeftLine,
  RiTimeLine,
} from "react-icons/ri";
import { toast } from "sonner";
import DocsPage from "@/components/shared/docs/DocsPage";
import {
  IssueViewModeToggle,
  type IssueViewMode,
} from "@/components/issue/IssueViewModeToggle";
import { ProjectIssuesKanbanBoard } from "@/components/projects/ProjectIssuesKanbanBoard";
import { useIssueStates } from "@/hooks/useIssueStates";
import { useCancelIssue, useUpdateIssue } from "@/hooks/useIssueApi";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  buildIssueStateSummary,
  isActiveIssue,
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
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OptimisticIssueState = Pick<Issue, "state" | "stateId">;

function formatRelativeTime(
  date: string,
  t: (key: string, values?: Record<string, string | number>) => string,
  locale: string,
) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / (1000 * 60)), 0);

  if (diffMinutes < 1) {
    return t("subviews.relativeTime.justNow");
  }

  if (diffMinutes < 60) {
    return t("subviews.relativeTime.minutesAgo", { count: diffMinutes });
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return t("subviews.relativeTime.hoursAgo", { count: diffHours });
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return t("subviews.relativeTime.daysAgo", { count: diffDays });
  }

  return formatShortDate(date, locale);
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
        "flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-app-border bg-app-content-bg/80 shadow-sm",
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

// MARK: IssueList
function ProjectIssueList({
  issues,
  pendingIssueIds,
  onOpenIssue,
  onCancelIssue,
  canCancelIssue,
  tProjects,
  locale,
}: {
  issues: Issue[];
  pendingIssueIds: Set<string>;
  onOpenIssue: (issue: Issue) => void;
  onCancelIssue: (issue: Issue) => void;
  canCancelIssue: (issue: Issue) => boolean;
  tProjects: (key: string, values?: Record<string, string | number>) => string;
  locale: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-app-border bg-app-content-bg">
      {issues.map((issue) => {
        const priorityMeta = getPriorityTone(issue);
        const stateMeta = getIssueStateMeta(issue);
        const isPending = pendingIssueIds.has(issue.id);
        const canCancel = canCancelIssue(issue);
        const issueRow = (
          <button
            type="button"
            onClick={() => onOpenIssue(issue)}
            className="group flex w-full cursor-pointer items-center gap-4 border-b border-app-border px-4 py-3 text-left transition last:border-b-0 hover:bg-app-button-hover/35"
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
                  {formatShortDate(issue.dueDate, locale)}
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

        return (
          <ContextMenu key={issue.id}>
            <ContextMenuTrigger asChild>{issueRow}</ContextMenuTrigger>
            <ContextMenuContent className="w-44">
              <ContextMenuGroup>
                <ContextMenuItem onSelect={() => onOpenIssue(issue)}>
                  {tProjects("subviews.issues.openIssue")}
                </ContextMenuItem>
                <ContextMenuItem
                  variant="destructive"
                  disabled={isPending || !canCancel}
                  onSelect={() => onCancelIssue(issue)}
                >
                  {tProjects("subviews.issues.cancelIssue")}
                </ContextMenuItem>
              </ContextMenuGroup>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
}

// MARK: ProjectIssues
export function ProjectIssuesSubview({
  workspaceId,
  projectIssues,
  issuesViewMode,
  issueBoardCategoryOrder,
  isLoadingProjectIssues,
  hasUnsavedIssueBoardCategoryOrder,
  currentTeamMemberId,
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
  currentTeamMemberId?: string;
  onCreateIssue: () => void;
  onOpenIssue: (issue: Issue) => void;
  onIssueBoardCategoryOrderChange: (order: IssueStateCategory[]) => void;
  onSaveIssueBoardCategoryOrder: () => void;
  onIssuesViewModeChange: (viewMode: IssueViewMode) => void;
}) {
  const tProjects = useTranslations("projects");
  const locale = useLocale();
  const { data: issueStates = [] } = useIssueStates(workspaceId, {
    enabled: !!workspaceId,
  });
  const updateIssueMutation = useUpdateIssue();
  const cancelIssueMutation = useCancelIssue();
  const [optimisticIssueStates, setOptimisticIssueStates] = useState<
    Record<string, OptimisticIssueState>
  >({});
  const [pendingIssueIds, setPendingIssueIds] = useState<Set<string>>(new Set());
  const [pendingCancelIssue, setPendingCancelIssue] = useState<Issue | null>(
    null,
  );

  useEffect(() => {
    setOptimisticIssueStates({});
    setPendingIssueIds(new Set());
  }, [projectIssues, workspaceId]);

  useEffect(() => {
    setPendingCancelIssue(null);
  }, [workspaceId]);

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
  const activeProjectIssues = useMemo(
    () => displayedIssues.filter(isActiveIssue),
    [displayedIssues],
  );
  const hiddenClosedIssueCount =
    displayedIssues.length - activeProjectIssues.length;
  const shouldListHideClosedIssues = issuesViewMode === "list";
  const visibleProjectIssues = shouldListHideClosedIssues
    ? activeProjectIssues
    : displayedIssues;
  const canCancelIssue = (issue: Issue) => {
    const creatorMemberId = issue.creatorMemberId || issue.creatorId;

    if (!creatorMemberId || !currentTeamMemberId) {
      return true;
    }

    return creatorMemberId === currentTeamMemberId;
  };

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

  const handleCancelIssue = () => {
    if (!workspaceId || !pendingCancelIssue) {
      return;
    }

    if (pendingIssueIds.has(pendingCancelIssue.id)) {
      return;
    }

    const issue = pendingCancelIssue;
    if (!canCancelIssue(issue)) {
      toast.error(tProjects("subviews.issues.onlyCreatorCanCancel"));
      setPendingCancelIssue(null);
      return;
    }

    const targetState = resolveIssueStateForCategory(
      issueStates,
      IssueStateCategory.CANCELED,
    );

    if (targetState) {
      setOptimisticIssueStates((current) => ({
        ...current,
        [issue.id]: {
          stateId: targetState.id,
          state: buildIssueStateSummary(targetState),
        },
      }));
    }

    setPendingIssueIds((current) => {
      const nextState = new Set(current);
      nextState.add(issue.id);
      return nextState;
    });

    cancelIssueMutation.mutate(
      {
        workspaceId,
        issueId: issue.id,
      },
      {
        onSuccess: () => {
          toast.success(tProjects("subviews.issues.cancelled"));
          setPendingCancelIssue(null);
          setPendingIssueIds((current) => {
            const nextState = new Set(current);
            nextState.delete(issue.id);
            return nextState;
          });
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : tProjects("subviews.issues.cancelFailed"),
          );
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
    <div className="flex h-full min-h-0 flex-col p-4 isolate">
      <ProjectSurfaceCard
        title={tProjects("subviews.issues.title")}
        subtitle={tProjects("subviews.issues.subtitle")}
        action={
          <button
            onClick={onCreateIssue}
            className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary transition hover:bg-app-button-hover"
          >
            <RiAddLine className="size-4" />
            {tProjects("subviews.issues.createIssue")}
          </button>
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 pb-4">
            <div className="text-xs text-app-text-secondary">
              {tProjects("subviews.issues.summary", {
                active: activeProjectIssues.length,
                suffix:
                  hiddenClosedIssueCount > 0
                    ? tProjects("subviews.issues.hiddenSuffix", {
                        count: hiddenClosedIssueCount,
                        hidden: shouldListHideClosedIssues
                          ? tProjects("subviews.issues.hiddenLabel")
                          : "",
                      })
                    : "",
              })}
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
                  {hasUnsavedIssueBoardCategoryOrder
                    ? tProjects("subviews.issues.saveBoardOrder")
                    : tProjects("subviews.issues.boardOrderSaved")}
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
                {tProjects("subviews.issues.loading")}
              </div>
            ) : visibleProjectIssues.length === 0 ? (
              <div className="flex h-full items-center justify-center overflow-y-auto px-2">
                <div className="w-full h-full rounded-2xl border border-dashed border-app-border bg-app-bg p-6 text-center">
                  <div className="text-base font-semibold text-app-text-primary">
                    {tProjects("subviews.issues.emptyTitle")}
                  </div>
                  <div className="mt-2 text-sm text-app-text-secondary">
                    {tProjects("subviews.issues.emptyDescription")}
                  </div>
                  <button
                    onClick={onCreateIssue}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
                  >
                    <RiAddLine className="size-4" />
                    {tProjects("subviews.issues.createIssue")}
                  </button>
                </div>
              </div>
            ) : issuesViewMode === "board" ? (
              <ProjectIssuesKanbanBoard
                issues={visibleProjectIssues}
                categoryOrder={issueBoardCategoryOrder}
                pendingIssueIds={pendingIssueIds}
                onOpenIssue={onOpenIssue}
                onCategoryOrderChange={onIssueBoardCategoryOrderChange}
                onMoveIssue={handleMoveIssueToCategory}
                onCancelIssue={setPendingCancelIssue}
                canCancelIssue={canCancelIssue}
              />
            ) : (
              <div className="h-full overflow-y-auto scrollbar-hidden">
                <ProjectIssueList
                  issues={visibleProjectIssues}
                  pendingIssueIds={pendingIssueIds}
                  onOpenIssue={onOpenIssue}
                  onCancelIssue={setPendingCancelIssue}
                  canCancelIssue={canCancelIssue}
                  tProjects={tProjects}
                  locale={locale}
                />
              </div>
            )}
          </div>
        </div>
      </ProjectSurfaceCard>

      <Dialog
        open={!!pendingCancelIssue}
        onOpenChange={(open) => {
          if (!open && !cancelIssueMutation.isPending) {
            setPendingCancelIssue(null);
          }
        }}
      >
        <DialogContent className="border-app-border bg-app-content-bg text-app-text-primary sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tProjects("subviews.issues.cancelDialog.title")}</DialogTitle>
            <DialogDescription>
              {tProjects("subviews.issues.cancelDialog.description")}
            </DialogDescription>
          </DialogHeader>
          {pendingCancelIssue && (
            <div className="rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-secondary">
              {pendingCancelIssue.key ? `${pendingCancelIssue.key} · ` : ""}
              {pendingCancelIssue.title}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={cancelIssueMutation.isPending}
              >
                {tProjects("subviews.issues.cancelDialog.keep")}
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelIssueMutation.isPending}
              onClick={handleCancelIssue}
            >
              {cancelIssueMutation.isPending
                ? tProjects("subviews.issues.cancelDialog.pending")
                : tProjects("subviews.issues.cancelDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const tProjects = useTranslations("projects");
  if (!currentUserId) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-8">
        <div className="rounded-2xl border border-dashed border-app-border bg-app-content-bg/95 px-6 py-10 text-center text-sm text-app-text-secondary">
          {tProjects("subviews.docs.missingUser")}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4">
      <div className="h-full overflow-hidden rounded-[28px] border border-app-border isolate bg-app-content-bg/80 shadow-sm">
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

// MARK: ProjectWorkflow
export function ProjectWorkflowSubview({
  relatedWorkflows,
}: {
  relatedWorkflows: ProjectWorkflowSummary[];
}) {
  const tProjects = useTranslations("projects");
  return (
    <div className="flex h-full min-h-0 flex-col p-4 isolate">
      <ProjectSurfaceCard
        title={tProjects("subviews.workflow.title")}
        subtitle={tProjects("subviews.workflow.subtitle")}
        action={
          <Link
            href="/workflows"
            className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-bg px-3 py-1 text-xs text-app-text-primary transition hover:bg-app-button-hover"
          >
            {tProjects("subviews.workflow.openCenter")}
            <RiArrowRightLine className="size-3.5" />
          </Link>
        }
      >
        {relatedWorkflows.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-bg/60 px-4 py-8 text-sm text-app-text-secondary">
            {tProjects("subviews.workflow.empty")}
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
                        {tProjects("subviews.workflow.linkedIssues", {
                          count: workflow.issueCount,
                          status: workflow.status,
                        })}
                      </div>
                    </div>
                    <div className="rounded-full border border-app-border bg-app-content-bg px-2 py-1 text-[11px] text-app-text-secondary">
                      {tProjects("subviews.workflow.steps", {
                        count: workflow.totalSteps,
                      })}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-app-text-secondary">
                    <div className="rounded-xl border border-app-border bg-app-content-bg/80 px-3 py-2">
                      {tProjects("subviews.workflow.version")} · {workflow.version || tProjects("subviews.workflow.notAvailable")}
                    </div>
                    <div className="rounded-xl border border-app-border bg-app-content-bg/80 px-3 py-2">
                      {tProjects("subviews.workflow.visibility")} · {workflow.visibility}
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

// MARK: ProjectSync
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
  const tProjects = useTranslations("projects");
  const locale = useLocale();
  const projectIssueMap = useMemo(
    () =>
      new Map<string, Issue>(projectIssues.map((issue) => [issue.id, issue])),
    [projectIssues],
  );

  return (
    <div className="flex h-full min-h-0 flex-col p-4 isolate">
      <ProjectSurfaceCard
        title={tProjects("subviews.sync.title")}
        subtitle={tProjects("subviews.sync.subtitle")}
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
            {tProjects("subviews.sync.updateSync")}
          </button>
        }
      >
        <div className="flex h-full min-h-0 flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-3">
              <div className="text-xs text-app-text-muted">{tProjects("subviews.sync.recentSync")}</div>
              <div className="mt-2 text-lg font-semibold text-app-text-primary">
                {selectedProject.lastSyncAt
                  ? formatRelativeTime(selectedProject.lastSyncAt, tProjects, locale)
                  : tProjects("subviews.sync.notRecorded")}
              </div>
            </div>
            <div className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-3">
              <div className="text-xs text-app-text-muted">{tProjects("subviews.sync.activityCount")}</div>
              <div className="mt-2 text-lg font-semibold text-app-text-primary">
                {recentActivity.length}
              </div>
            </div>
            <div className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-3">
              <div className="text-xs text-app-text-muted">{tProjects("subviews.sync.updatedAt")}</div>
              <div className="mt-2 text-lg font-semibold text-app-text-primary">
                {formatRelativeTime(selectedProject.updatedAt, tProjects, locale)}
              </div>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-app-border bg-app-bg/60 px-4 py-8 text-sm text-app-text-secondary">
              {tProjects("subviews.sync.empty")}
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
                          tProjects("subviews.sync.teamMember")) +
                          " · " +
                          formatRelativeTime(activity.createdAt, tProjects, locale)}
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
