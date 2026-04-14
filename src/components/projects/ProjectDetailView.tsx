"use client";

import React, { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  RiAddLine,
  RiAlarmWarningLine,
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiEdit2Line,
  RiFileList3Line,
  RiLoader4Line,
} from "react-icons/ri";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { isActiveIssueCategory, sortIssuesByUrgency } from "@/lib/issue-board";
import type { Issue } from "@/lib/fetchers/issue";
import type {
  Project,
  ProjectDetail,
  ProjectSummary,
  ProjectSummaryIssue,
} from "@/lib/fetchers/project";
import {
  formatPreciseDate,
  formatShortDate,
  getProjectRiskMeta,
  getProjectOwnerLabel,
  getProjectStatusMeta,
} from "@/components/projects/project-view-utils";
import { buildProjectPath } from "@/components/projects/project-route-utils";
import { useDocStore } from "@/stores/doc-store";
import { useCreateDocMutation, useDocsTree } from "@/hooks/useDocApi";
import {
  IssuePriority,
  IssueStateCategory,
  IssueStatus,
  VisibilityType,
} from "@/types/prisma";

interface ProjectDetailViewProps {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  selectedProject: Project | ProjectDetail;
  currentUserId?: string;
  projectSummary?: ProjectSummary;
  workspaceName: string;
  visibilityLabel: string;
  projectIssues: Issue[];
  isSelectionPending: boolean;
  isLoadingProjectDetail: boolean;
  canManageProjects: boolean;
  onBack: () => void;
  onCreateIssue: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenIssue: (issue: Issue) => void;
  onMarkSync: () => void;
  isMarkingSync?: boolean;
  showBackButton?: boolean;
}

type IssueStateLike = {
  name?: string | null;
  category?: IssueStateCategory | null;
};

type IssueStatusLike = {
  state?: IssueStateLike | null;
  currentStepStatus?: IssueStatus | null;
};

function formatRelativeTime(
  date: string,
  t: (key: string, values?: Record<string, string | number>) => string,
  locale: string,
) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / (1000 * 60)), 0);

  if (diffMinutes < 1) {
    return t("detail.relativeTime.justNow");
  }

  if (diffMinutes < 60) {
    return t("detail.relativeTime.minutesAgo", { count: diffMinutes });
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return t("detail.relativeTime.hoursAgo", { count: diffHours });
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return t("detail.relativeTime.daysAgo", { count: diffDays });
  }

  return formatShortDate(date, locale);
}

function isCompletedIssueLike(issue: IssueStatusLike) {
  return issue.state?.category === IssueStateCategory.DONE;
}

function isActiveIssueLike(issue: IssueStatusLike) {
  return isActiveIssueCategory(issue.state?.category);
}

function isBlockedIssueLike(issue: IssueStatusLike) {
  if (issue.currentStepStatus === IssueStatus.BLOCKED) {
    return true;
  }

  const stateName = issue.state?.name?.toLowerCase() ?? "";
  return (
    stateName.includes("blocked") ||
    stateName.includes("block")
  );
}

function getIssuePriorityWeight(priority?: IssuePriority | null) {
  switch (priority) {
    case IssuePriority.URGENT:
      return 4;
    case IssuePriority.HIGH:
      return 3;
    case IssuePriority.NORMAL:
      return 2;
    case IssuePriority.LOW:
      return 1;
    default:
      return 0;
  }
}

function getIssueStateLabel(
  issue: Pick<ProjectSummaryIssue, "state" | "currentStepStatus">,
  t: (key: string) => string,
) {
  if (issue.currentStepStatus === IssueStatus.BLOCKED) {
    return t("detail.issueState.blocked");
  }

  if (issue.currentStepStatus === IssueStatus.DONE) {
    return t("detail.issueState.done");
  }

  if (issue.currentStepStatus === IssueStatus.IN_PROGRESS) {
    return t("detail.issueState.inProgress");
  }

  return issue.state?.name || t("detail.issueState.uncategorized");
}

function getAssigneeLabel(
  issue: Pick<ProjectSummaryIssue, "assignees" | "directAssigneeId">,
  t: (key: string) => string,
) {
  const firstAssignee = issue.assignees.find((item) => item.member?.user);

  if (firstAssignee?.member?.user) {
    return (
      firstAssignee.member.user.name ||
      firstAssignee.member.user.email ||
      t("detail.assignee.assigned")
    );
  }

  return issue.directAssigneeId
    ? t("detail.assignee.assigned")
    : t("detail.assignee.pending");
}

function normalizeIssueForSummary(issue: Issue): ProjectSummaryIssue {
  return {
    id: issue.id,
    key: issue.key,
    title: issue.title,
    description: issue.description,
    dueDate: issue.dueDate,
    priority: issue.priority,
    issueType: issue.issueType,
    workflowId: issue.workflowId,
    directAssigneeId: issue.directAssigneeId,
    currentStepStatus: issue.currentStepStatus,
    currentStepIndex: issue.currentStepIndex,
    totalSteps: issue.totalSteps,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    state: issue.state
      ? {
          id: issue.state.id,
          name: issue.state.name,
          color: issue.state.color,
          category: issue.state.category,
        }
      : null,
    assignees:
      issue.assignees?.map((assignee) => ({
        member: assignee.member
          ? {
              id: assignee.member.id,
              user: assignee.member.user
                ? {
                    id: assignee.member.user.id,
                    name: assignee.member.user.name,
                    email: assignee.member.user.email || "",
                    avatarUrl:
                      assignee.member.user.avatarUrl ||
                      assignee.member.user.avatar_url,
                    avatar_url:
                      assignee.member.user.avatar_url ||
                      assignee.member.user.avatarUrl,
                  }
                : null,
            }
          : null,
      })) ?? [],
  };
}

function buildFallbackMetrics(
  issues: Issue[],
  lastSyncAt?: string | null,
): ProjectSummary["metrics"] {
  const activeIssues = issues.filter((issue) => isActiveIssueLike(issue));
  const completedIssues = issues.filter((issue) =>
    isCompletedIssueLike(issue),
  ).length;
  const completionBaseIssueCount = activeIssues.length + completedIssues;
  const blockedIssues = activeIssues.filter((issue) =>
    isBlockedIssueLike(issue),
  ).length;
  const overdueIssues = activeIssues.filter((issue) => {
    if (!issue.dueDate) {
      return false;
    }

    return new Date(issue.dueDate).getTime() < Date.now();
  }).length;
  const workflowCount = new Set(
    issues.map((issue) => issue.workflowId).filter(Boolean),
  ).size;
  const highPriorityIssues = activeIssues.filter(
    (issue) =>
      issue.priority === IssuePriority.HIGH ||
      issue.priority === IssuePriority.URGENT,
  ).length;
  const unassignedIssues = activeIssues.filter((issue) => {
    const hasAssignee =
      issue.directAssigneeId ||
      issue.assignees?.some((assignee) => Boolean(assignee.member?.id));
    return !hasAssignee;
  }).length;

  return {
    totalIssues: activeIssues.length,
    openIssues: activeIssues.length,
    completedIssues,
    blockedIssues,
    overdueIssues,
    workflowCount,
    workflowIssueCount: activeIssues.filter((issue) =>
      Boolean(issue.workflowId),
    ).length,
    highPriorityIssues,
    unassignedIssues,
    completionRate:
      completionBaseIssueCount > 0
        ? Math.round((completedIssues / completionBaseIssueCount) * 100)
        : 0,
    staleSyncDays: lastSyncAt
      ? Math.floor(
          (Date.now() - new Date(lastSyncAt).getTime()) / (1000 * 60 * 60 * 24),
        )
      : null,
  };
}

function buildFallbackAttentionItems(
  project: Project | ProjectDetail,
  metrics: ProjectSummary["metrics"],
  t: (key: string, values?: Record<string, string | number>) => string,
): ProjectSummary["attentionItems"] {
  const items: ProjectSummary["attentionItems"] = [];

  if (metrics.blockedIssues > 0) {
    items.push({
      id: "blocked-issues",
      severity: "high",
      title: t("detail.attention.blockedTitle"),
      description: t("detail.attention.blockedDescription", {
        count: metrics.blockedIssues,
      }),
    });
  }

  if (metrics.overdueIssues > 0) {
    items.push({
      id: "overdue-issues",
      severity: "medium",
      title: t("detail.attention.overdueTitle"),
      description: t("detail.attention.overdueDescription", {
        count: metrics.overdueIssues,
      }),
    });
  }

  if ((metrics.staleSyncDays ?? 0) >= 7) {
    items.push({
      id: "stale-sync",
      severity: "medium",
      title: t("detail.attention.staleSyncTitle"),
      description: t("detail.attention.staleSyncDescription", {
        count: metrics.staleSyncDays ?? 0,
      }),
    });
  }

  if (
    items.length === 0 &&
    project.riskLevel !== undefined &&
    project.riskLevel !== null
  ) {
    items.push({
      id: "healthy",
      severity: "low",
      title: t("detail.attention.healthyTitle"),
      description: t("detail.attention.healthyDescription"),
    });
  }

  return items;
}

// MARK: Panel
function ProjectPanel({
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
        // Keep this isolated so the panel remains visually opaque over the backdrop.
        "rounded-[28px] border border-app-border bg-app-content-bg/80 p-5 shadow-sm isolate",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-app-text-primary">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-app-text-secondary">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// MARK: ProjectMetric
function ProjectMetricCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClassName =
    tone === "danger"
      ? "border-rose-500/20 bg-app-content-bg"
      : tone === "warning"
        ? "border-amber-500/20 bg-app-content-bg"
        : tone === "success"
          ? "border-emerald-500/20 bg-app-content-bg"
          : "border-app-border bg-app-content-bg";

  return (
    <div className={cn("rounded-2xl border px-4 py-3", toneClassName)}>
      <div className="text-xs text-app-text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-app-text-primary">
        {value}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-app-text-secondary">{hint}</div>
      )}
    </div>
  );
}

// MARK: ProjectIssue
function ProjectIssueRow({
  issue,
  isHighlighted = false,
  onOpenIssue,
  tProjects,
  locale,
}: {
  issue: ProjectSummaryIssue;
  isHighlighted?: boolean;
  onOpenIssue?: (issueId: string) => void;
  tProjects: (key: string, values?: Record<string, string | number>) => string;
  locale: string;
}) {
  const priorityTone = getIssuePriorityWeight(issue.priority);

  return (
    <button
      type="button"
      onClick={() => onOpenIssue?.(issue.id)}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition hover:bg-app-button-hover/35",
        isHighlighted
          ? "border-amber-500/20 bg-app-content-bg"
          : "border-app-border bg-app-content-bg",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-2xl border text-xs font-medium",
          isBlockedIssueLike(issue)
            ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
            : "border-app-border bg-app-content-bg text-app-text-secondary",
        )}
      >
        {issue.key || issue.id.slice(0, 4)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-app-text-primary">
            {issue.title}
          </span>
          {priorityTone >= 3 && (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
              {issue.priority === IssuePriority.URGENT ? "Urgent" : "High priority"}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-app-text-muted">
          <span>{getIssueStateLabel(issue, tProjects)}</span>
          <span>·</span>
          <span>{getAssigneeLabel(issue, tProjects)}</span>
          {issue.dueDate && (
            <>
              <span>·</span>
              <span>{formatShortDate(issue.dueDate, locale)}</span>
            </>
          )}
        </div>
      </div>

      <RiArrowRightSLine className="size-4 shrink-0 text-app-text-muted" />
    </button>
  );
}

// MARK: ProjectDetail
export function ProjectDetailView({
  workspaceId,
  workspaceType,
  selectedProject,
  currentUserId,
  projectSummary,
  workspaceName,
  visibilityLabel,
  projectIssues,
  isSelectionPending,
  isLoadingProjectDetail,
  canManageProjects,
  onBack,
  onCreateIssue,
  onEdit,
  onDelete,
  onOpenIssue,
  showBackButton = true,
}: ProjectDetailViewProps) {
  const tProjects = useTranslations("projects");
  const locale = useLocale();
  const router = useRouter();
  const setActiveDocId = useDocStore((state) => state.setActiveDocId);
  const createProjectDoc = useCreateDocMutation();

  const docsContext = workspaceType === "PERSONAL" ? "personal" : "team";
  const { data: projectDocs = [] } = useDocsTree(
    workspaceId,
    {
      workspaceType,
      context: docsContext,
      projectId: selectedProject.id,
      includeArchived: false,
    },
    {
      enabled: !!workspaceId && !!currentUserId,
    },
  );

  const displayedIssues = useMemo(
    () => sortIssuesByUrgency(projectIssues),
    [projectIssues],
  );

  const fallbackMetrics = useMemo(
    () => buildFallbackMetrics(displayedIssues, selectedProject.lastSyncAt),
    [displayedIssues, selectedProject.lastSyncAt],
  );
  const metrics = projectSummary?.metrics ?? fallbackMetrics;
  const blockedIssues =
    projectSummary?.blockedIssues ??
    displayedIssues
      .filter((issue) => isActiveIssueLike(issue) && isBlockedIssueLike(issue))
      .slice(0, 5)
      .map(normalizeIssueForSummary);
  const attentionItems =
    projectSummary?.attentionItems ??
    buildFallbackAttentionItems(selectedProject, fallbackMetrics, tProjects);
  const relatedWorkflows = projectSummary?.workflows ?? [];

  const projectIssueMap = useMemo(
    () =>
      new Map<string, Issue>(projectIssues.map((issue) => [issue.id, issue])),
    [projectIssues],
  );

  const statusMeta = getProjectStatusMeta(tProjects)[selectedProject.status];
  const riskMeta = getProjectRiskMeta(tProjects)[selectedProject.riskLevel];
  const docsStorageKey = `docs-open-${workspaceId}-${workspaceType}-${docsContext}-${selectedProject.id}`;
  const projectDocsRoute = buildProjectPath(selectedProject.id, "docs");

  const openSummaryIssue = (issueId: string) => {
    const issue = projectIssueMap.get(issueId);

    if (!issue) {
      toast.message(tProjects("detail.summary.missingIssue"));
      return;
    }

    onOpenIssue(issue);
  };

  const openProjectDocHub = () => {
    router.push(projectDocsRoute);
  };

  const openProjectDoc = (docId: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(docsStorageKey, JSON.stringify([docId]));
    }

    setActiveDocId(docId);
    router.push(projectDocsRoute);
  };

  const handleCreateProjectDoc = async () => {
    if (!currentUserId) {
      toast.error(tProjects("detail.summary.docCreateAuthRequired"));
      return;
    }

    try {
      const createdDoc = await createProjectDoc.mutateAsync({
        workspaceId,
        data: {
          title: `${selectedProject.name} doc`,
          projectId: selectedProject.id,
          visibility:
            workspaceType === "TEAM"
              ? VisibilityType.TEAM_EDITABLE
              : VisibilityType.PRIVATE,
          content: JSON.stringify([
            {
              id: "initial",
              type: "paragraph",
              content: [],
            },
          ]),
        },
      });

      toast.success(tProjects("detail.summary.docCreated"));
      openProjectDoc(createdDoc._id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tProjects("detail.summary.docCreateFailed"),
      );
    }
  };

  return (
    <div className="flex flex-1 h-full flex-col select-none z-50">
      <div className="mx-auto flex h-full min-h-0 w-full flex-col overflow-y-auto px-4 pb-8 pt-6">
        <div className="shrink-0">
          {showBackButton && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-content-bg px-3 py-1 text-xs font-medium text-app-text-secondary transition hover:bg-app-button-hover hover:text-app-text-primary"
            >
              <RiArrowLeftLine className="size-3.5" />
            </button>
          )}

          <div
            className={cn(
              "relative isolate overflow-hidden rounded-[32px] border border-app-border bg-app-content-bg/80 px-5 py-5",
              showBackButton ? "mt-4" : "mt-0",
            )}
          >
            <div className="relative z-10">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-app-text-muted">
                    <span>{workspaceName}</span>
                    <span>·</span>
                    <span>{visibilityLabel}</span>
                    {(isSelectionPending || isLoadingProjectDetail) && (
                      <RiLoader4Line className="size-3.5 animate-spin" />
                    )}
                  </div>

                  <h2 className="mt-2 text-2xl font-semibold text-app-text-primary">
                    {selectedProject.name}
                  </h2>

                  <p className="mt-3 max-w-4xl text-sm leading-6 text-app-text-primary/90">
                    {selectedProject.brief ||
                      tProjects("detail.summary.missingBrief")}
                  </p>

                  {selectedProject.description && (
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-app-text-secondary">
                      {selectedProject.description}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                        statusMeta.chipClassName,
                      )}
                    >
                      {statusMeta.icon}
                      {statusMeta.label}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                        riskMeta.chipClassName,
                      )}
                    >
                      {riskMeta.icon}
                      {riskMeta.label}
                    </span>
                    {selectedProject.phase && (
                      <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                        {tProjects("detail.summary.phase")} · {selectedProject.phase}
                      </span>
                    )}
                    <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                      {tProjects("detail.summary.owner")} · {getProjectOwnerLabel(selectedProject, tProjects)}
                    </span>
                    <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                      {tProjects("detail.summary.activeIssues", {
                        count: metrics.totalIssues,
                      })}
                    </span>
                    <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                      {tProjects("detail.summary.workflowCount", {
                        count: metrics.workflowCount,
                      })}
                    </span>
                    <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                      {tProjects("detail.summary.docsCount", {
                        count: projectDocs.length,
                      })}
                    </span>
                    <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                      {tProjects("detail.summary.updatedAt", {
                        value: formatPreciseDate(selectedProject.updatedAt, locale),
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {canManageProjects && (
                    <button
                      onClick={onEdit}
                      className="inline-flex items-center gap-2 rounded-xl border border-app-border bg-app-content-bg px-3 py-2 text-sm text-app-text-primary transition hover:bg-app-button-hover cursor-pointer"
                    >
                      <RiEdit2Line className="size-4" />
                      {tProjects("detail.summary.edit")}
                    </button>
                  )}
                  {canManageProjects && (
                    <button
                      onClick={onDelete}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-app-content-bg px-3 py-2 text-sm text-red-600 transition hover:bg-red-500/15 dark:text-red-300 cursor-pointer"
                    >
                      <RiDeleteBinLine className="size-4" />
                      {tProjects("detail.summary.delete")}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ProjectMetricCard
                  label={tProjects("detail.summary.completion")}
                  value={`${metrics.completionRate}%`}
                  hint={tProjects("detail.summary.completionHint", {
                    completed: metrics.completedIssues,
                    total: metrics.totalIssues,
                  })}
                  tone={metrics.completionRate >= 70 ? "success" : "default"}
                />
                <ProjectMetricCard
                  label={tProjects("detail.summary.riskAndDelay")}
                  value={`${metrics.blockedIssues + metrics.overdueIssues}`}
                  hint={tProjects("detail.summary.riskAndDelayHint", {
                    blocked: metrics.blockedIssues,
                    overdue: metrics.overdueIssues,
                  })}
                  tone={
                    metrics.blockedIssues > 0
                      ? "danger"
                      : metrics.overdueIssues > 0
                        ? "warning"
                        : "success"
                  }
                />
                <ProjectMetricCard
                  label={tProjects("detail.summary.executionSurface")}
                  value={`${metrics.workflowIssueCount}`}
                  hint={tProjects("detail.summary.executionSurfaceHint", {
                    workflowCount: metrics.workflowCount,
                    highPriority: metrics.highPriorityIssues,
                  })}
                />
                <ProjectMetricCard
                  label={tProjects("detail.summary.recentSync")}
                  value={
                    selectedProject.lastSyncAt
                      ? formatRelativeTime(selectedProject.lastSyncAt, tProjects, locale)
                      : tProjects("detail.summary.notRecorded")
                  }
                  hint={
                    selectedProject.lastSyncAt
                      ? formatPreciseDate(selectedProject.lastSyncAt, locale)
                      : tProjects("detail.summary.recentSyncHint")
                  }
                  tone={
                    (metrics.staleSyncDays ?? 0) >= 7 ? "warning" : "default"
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <ProjectPanel
            title={tProjects("detail.summary.workspaceTitle")}
            // MARK: -- Workspace
            action={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onCreateIssue}
                  className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-content-bg px-3 py-1 text-xs text-app-text-primary transition hover:bg-app-button-hover"
                >
                  <RiAddLine className="size-3.5" />
                  {tProjects("detail.summary.createIssue")}
                </button>
                <button
                  type="button"
                  onClick={handleCreateProjectDoc}
                  className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-content-bg px-3 py-1 text-xs text-app-text-primary transition hover:bg-app-button-hover"
                >
                  <RiFileList3Line className="size-3.5" />
                  {tProjects("detail.summary.createDoc")}
                </button>
              </div>
            }
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 bg-app-content-bg/80">
              <button
                type="button"
                onClick={() =>
                  router.push(buildProjectPath(selectedProject.id, "issues"))
                }
                className="rounded-2xl border border-app-border bg-app-content-bg px-4 py-4 text-left transition hover:bg-app-button-hover/35 cursor-pointer"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-app-text-muted">
                  {tProjects("detail.summary.workspaceCards.issues")}
                </div>
                <div className="mt-3 text-2xl font-semibold text-app-text-primary">
                  {metrics.totalIssues}
                </div>
              </button>

              <button
                type="button"
                onClick={openProjectDocHub}
                className="rounded-2xl border border-app-border bg-app-content-bg px-4 py-4 text-left transition hover:bg-app-button-hover/35 cursor-pointer"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-app-text-muted">
                  {tProjects("detail.summary.workspaceCards.docs")}
                </div>
                <div className="mt-3 text-2xl font-semibold text-app-text-primary">
                  {projectDocs.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(buildProjectPath(selectedProject.id, "workflow"))
                }
                className="rounded-2xl border border-app-border bg-app-content-bg px-4 py-4 text-left transition hover:bg-app-button-hover/35 cursor-pointer"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-app-text-muted">
                  {tProjects("detail.summary.workspaceCards.workflow")}
                </div>
                <div className="mt-3 text-2xl font-semibold text-app-text-primary">
                  {relatedWorkflows.length}
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(buildProjectPath(selectedProject.id, "sync"))
                }
                className="rounded-2xl border border-app-border bg-app-content-bg px-4 py-4 text-left transition hover:bg-app-button-hover/35 cursor-pointer"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-app-text-muted">
                  {tProjects("detail.summary.workspaceCards.sync")}
                </div>
                <div className="mt-3 text-2xl font-semibold text-app-text-primary">
                  {selectedProject.lastSyncAt
                    ? formatRelativeTime(selectedProject.lastSyncAt, tProjects, locale)
                    : tProjects("detail.summary.notRecorded")}
                </div>
              </button>
            </div>
          </ProjectPanel>
        </div>

        <div className="mt-4">
          <ProjectPanel
            title={tProjects("detail.summary.risksTitle")}
            // MARK: -- Risks
          >
            <div className="space-y-3">
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-2xl border px-4 py-3",
                    item.severity === "high"
                      ? "border-rose-500/20 bg-rose-500/10"
                      : item.severity === "medium"
                        ? "border-amber-500/20 bg-amber-500/10"
                        : "border-emerald-500/20 bg-emerald-500/10",
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-app-text-primary">
                    <RiAlarmWarningLine className="size-4" />
                    {item.title}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-app-text-secondary">
                    {item.description}
                  </div>
                </div>
              ))}

              <div className="pt-1">
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-app-text-muted">
                  {tProjects("detail.summary.blockedIssuesTitle")}
                </div>
                {blockedIssues.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-app-border bg-app-content-bg px-4 py-5 text-sm text-app-text-secondary">
                    {tProjects("detail.summary.blockedIssuesEmpty")}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blockedIssues.map((issue) => (
                      <ProjectIssueRow
                        key={issue.id}
                        issue={issue}
                        onOpenIssue={openSummaryIssue}
                        tProjects={tProjects}
                        locale={locale}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ProjectPanel>
        </div>
      </div>
    </div>
  );
}
