"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiEdit2Line,
  RiLayoutGridLine,
  RiListUnordered,
  RiLoader4Line,
} from "react-icons/ri";
import { toast } from "sonner";
import { useUpdateIssue } from "@/hooks/useIssueApi";
import { useIssueStates } from "@/hooks/useIssueStates";
import { cn } from "@/lib/utils";
import {
  buildIssueStateSummary,
  resolveIssueStateForCategory,
  sortIssuesByUrgency,
} from "@/lib/issue-board";
import type { Issue } from "@/lib/fetchers/issue";
import type { Project, ProjectDetail } from "@/lib/fetchers/project";
import {
  formatPreciseDate,
  formatShortDate,
  getIssueStateMeta,
  getPriorityTone,
} from "@/components/projects/project-view-utils";
import { ProjectIssuesKanbanBoard } from "@/components/projects/ProjectIssuesKanbanBoard";
import { IssueStateCategory } from "@/types/prisma";

type IssuesViewMode = "list" | "board";
type OptimisticIssueState = Pick<Issue, "state" | "stateId">;

interface ProjectDetailViewProps {
  workspaceId: string;
  selectedProject: Project | ProjectDetail;
  workspaceName: string;
  visibilityLabel: string;
  projectIssues: Issue[];
  issuesViewMode: IssuesViewMode;
  issueBoardCategoryOrder: IssueStateCategory[];
  isSelectionPending: boolean;
  isLoadingProjectDetail: boolean;
  isLoadingProjectIssues: boolean;
  canManageProjects: boolean;
  onBack: () => void;
  onCreateIssue: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenIssue: (issue: Issue) => void;
  onIssueBoardCategoryOrderChange: (order: IssueStateCategory[]) => void;
  onSaveIssueBoardCategoryOrder: () => void;
  onIssuesViewModeChange: (viewMode: IssuesViewMode) => void;
  hasUnsavedIssueBoardCategoryOrder: boolean;
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
            className="group flex w-full items-center gap-4 border-b border-app-border px-4 py-3 text-left transition last:border-b-0 hover:bg-app-button-hover/35"
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
                <b className="text-xs text-white/80 text-bold">
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

export function ProjectDetailView({
  workspaceId,
  selectedProject,
  workspaceName,
  visibilityLabel,
  projectIssues,
  issuesViewMode,
  issueBoardCategoryOrder,
  isSelectionPending,
  isLoadingProjectDetail,
  isLoadingProjectIssues,
  canManageProjects,
  onBack,
  onCreateIssue,
  onEdit,
  onDelete,
  onOpenIssue,
  onIssueBoardCategoryOrderChange,
  onSaveIssueBoardCategoryOrder,
  onIssuesViewModeChange,
  hasUnsavedIssueBoardCategoryOrder,
}: ProjectDetailViewProps) {
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
  }, [selectedProject.id, workspaceId]);

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
      toast.error("当前工作空间无效，无法更新 Issue 类别");
      return;
    }

    if (pendingIssueIds.has(issue.id)) {
      return;
    }

    const targetState = resolveIssueStateForCategory(issueStates, nextCategory);

    if (!targetState) {
      toast.error(`当前 workspace 还没有可用的 ${nextCategory} 状态`);
      return;
    }

    if (issue.stateId === targetState.id) {
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
        onError: (error) => {
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
          toast.error(
            error instanceof Error ? error.message : "更新 Issue 类别失败，请重试",
          );
        },
      },
    );
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="mx-auto flex h-full min-h-0 w-full flex-col px-6 pt-6">
        <div className="shrink-0">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-content-bg px-3 py-1 text-xs font-medium text-app-text-secondary transition hover:bg-app-button-hover hover:text-app-text-primary"
          >
            <RiArrowLeftLine className="size-3.5" />
            返回项目概览
          </button>

          <div className="mt-4 flex flex-col gap-4 pb-0 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-app-text-primary">
                {selectedProject.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-app-text-muted">
                <span>{workspaceName}</span>
                <span>·</span>
                <span>{visibilityLabel}</span>
                <span>·</span>
                <span>{projectIssues.length} issues</span>
                <span>·</span>
                <span>更新于 {formatPreciseDate(selectedProject.updatedAt)}</span>
                {(isSelectionPending || isLoadingProjectDetail) && (
                  <RiLoader4Line className="size-3.5 animate-spin" />
                )}
              </div>
              {selectedProject.description && (
                <p className="mt-2 text-sm text-app-text-secondary">
                  {selectedProject.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onCreateIssue}
                className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-content-bg px-3 py-2 text-sm text-app-text-primary transition hover:bg-app-button-hover"
              >
                <RiAddLine className="size-4" />
                新建 Issue
              </button>
              {canManageProjects && (
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-content-bg px-3 py-2 text-sm text-app-text-primary transition hover:bg-app-button-hover"
                >
                  <RiEdit2Line className="size-4" />
                  编辑
                </button>
              )}
              {canManageProjects && (
                <button
                  onClick={onDelete}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600 transition hover:bg-red-500/15 dark:text-red-300"
                >
                  <RiDeleteBinLine className="size-4" />
                  删除
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-3xl">
          <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 px-1 py-4 backdrop-blur">
            <div className="text-sm font-medium text-app-text-primary">Issues</div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {issuesViewMode === "board" && (
                <button
                  type="button"
                  onClick={onSaveIssueBoardCategoryOrder}
                  className={cn(
                    "inline-flex h-8 items-center rounded-xl border px-3 text-xs font-medium transition",
                    hasUnsavedIssueBoardCategoryOrder
                      ? "border-sky-500/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
                      : "border-app-border bg-app-content-bg text-app-text-secondary hover:bg-app-button-hover",
                  )}
                >
                  {hasUnsavedIssueBoardCategoryOrder ? "保存看板顺序" : "已保存顺序"}
                </button>
              )}
              <div className="flex items-center rounded-full border border-app-border bg-app-content-bg/70 p-0.5">
                <button
                  type="button"
                  onClick={() => onIssuesViewModeChange("list")}
                  className={cn(
                    "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition",
                    issuesViewMode === "list"
                      ? "bg-app-bg text-app-text-primary shadow-sm"
                      : "text-app-text-secondary hover:text-app-text-primary",
                  )}
                >
                  <RiListUnordered className="size-3.5" />
                  列表
                </button>
                <button
                  type="button"
                  onClick={() => onIssuesViewModeChange("board")}
                  className={cn(
                    "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition",
                    issuesViewMode === "board"
                      ? "bg-app-bg text-app-text-primary shadow-sm"
                      : "text-app-text-secondary hover:text-app-text-primary",
                  )}
                >
                  <RiLayoutGridLine className="size-3.5" />
                  看板
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            {isLoadingProjectIssues ? (
              <div className="flex h-full items-center justify-center px-6 text-app-text-secondary">
                <RiLoader4Line className="mr-2 size-5 animate-spin" />
                正在加载项目任务...
              </div>
            ) : displayedIssues.length === 0 ? (
              <div className="flex h-full items-center justify-center overflow-y-auto px-6 py-12">
                <div className="w-full rounded-2xl border border-dashed border-app-border bg-app-content-bg px-6 py-12 text-center">
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
              <div className="h-full overflow-y-auto pt-0 scrollbar-hidden">
                <ProjectIssueList
                  issues={displayedIssues}
                  onOpenIssue={onOpenIssue}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
