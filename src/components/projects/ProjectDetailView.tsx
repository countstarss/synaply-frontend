"use client";

import React, { useMemo } from "react";
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
  getProjectOwnerLabel,
  PROJECT_RISK_META,
  PROJECT_STATUS_META,
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
import AmbientGlow from "../global/AmbientGlow";

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
    stateName.includes("block") ||
    stateName.includes("阻塞") ||
    stateName.includes("卡住")
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
) {
  if (issue.currentStepStatus === IssueStatus.BLOCKED) {
    return "阻塞";
  }

  if (issue.currentStepStatus === IssueStatus.DONE) {
    return "已完成";
  }

  if (issue.currentStepStatus === IssueStatus.IN_PROGRESS) {
    return "进行中";
  }

  return issue.state?.name || "未分类";
}

function getAssigneeLabel(
  issue: Pick<ProjectSummaryIssue, "assignees" | "directAssigneeId">,
) {
  const firstAssignee = issue.assignees.find((item) => item.member?.user);

  if (firstAssignee?.member?.user) {
    return (
      firstAssignee.member.user.name ||
      firstAssignee.member.user.email ||
      "已分配"
    );
  }

  return issue.directAssigneeId ? "已分配" : "待分配";
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
): ProjectSummary["attentionItems"] {
  const items: ProjectSummary["attentionItems"] = [];

  if (metrics.blockedIssues > 0) {
    items.push({
      id: "blocked-issues",
      severity: "high",
      title: "存在阻塞中的任务",
      description: `当前有 ${metrics.blockedIssues} 个任务需要解阻。`,
    });
  }

  if (metrics.overdueIssues > 0) {
    items.push({
      id: "overdue-issues",
      severity: "medium",
      title: "有任务已经延期",
      description: `${metrics.overdueIssues} 个任务超过了截止时间。`,
    });
  }

  if ((metrics.staleSyncDays ?? 0) >= 7) {
    items.push({
      id: "stale-sync",
      severity: "medium",
      title: "同步节奏偏慢",
      description: `距离上次同步已经过去 ${metrics.staleSyncDays} 天。`,
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
      title: "项目状态总体稳定",
      description: "当前没有明显的延期或阻塞信号，可以继续围绕关键事项推进。",
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
        // 这里isolate是不透明的关键
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
}: {
  issue: ProjectSummaryIssue;
  isHighlighted?: boolean;
  onOpenIssue?: (issueId: string) => void;
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
              {issue.priority === IssuePriority.URGENT ? "紧急" : "高优先级"}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-app-text-muted">
          <span>{getIssueStateLabel(issue)}</span>
          <span>·</span>
          <span>{getAssigneeLabel(issue)}</span>
          {issue.dueDate && (
            <>
              <span>·</span>
              <span>{formatShortDate(issue.dueDate)}</span>
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
    buildFallbackAttentionItems(selectedProject, fallbackMetrics);
  const relatedWorkflows = projectSummary?.workflows ?? [];

  const projectIssueMap = useMemo(
    () =>
      new Map<string, Issue>(projectIssues.map((issue) => [issue.id, issue])),
    [projectIssues],
  );

  const statusMeta = PROJECT_STATUS_META[selectedProject.status];
  const riskMeta = PROJECT_RISK_META[selectedProject.riskLevel];
  const docsStorageKey = `docs-open-${workspaceId}-${workspaceType}-${docsContext}-${selectedProject.id}`;
  const projectDocsRoute = buildProjectPath(selectedProject.id, "docs");

  const openSummaryIssue = (issueId: string) => {
    const issue = projectIssueMap.get(issueId);

    if (!issue) {
      toast.message("Issue 详情正在同步，请稍后再试");
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
      toast.error("当前用户信息不可用，暂时无法创建文档");
      return;
    }

    try {
      const createdDoc = await createProjectDoc.mutateAsync({
        workspaceId,
        data: {
          title: `${selectedProject.name} 项目文档`,
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

      toast.success("已创建项目文档");
      openProjectDoc(createdDoc._id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建文档失败");
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
                      "这个项目还没有写一句话 brief，建议补充项目目标、交付方向和成功标准。"}
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
                        阶段 · {selectedProject.phase}
                      </span>
                    )}
                    <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                      负责人 · {getProjectOwnerLabel(selectedProject)}
                    </span>
                    <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                      {metrics.totalIssues} 个有效 issue
                    </span>
                    <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                      {metrics.workflowCount} workflows
                    </span>
                    <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                      {projectDocs.length} docs
                    </span>
                    <span className="rounded-full border border-app-border bg-app-content-bg px-2.5 py-1 text-[11px] text-app-text-secondary">
                      更新于 {formatPreciseDate(selectedProject.updatedAt)}
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
                      编辑
                    </button>
                  )}
                  {canManageProjects && (
                    <button
                      onClick={onDelete}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-app-content-bg px-3 py-2 text-sm text-red-600 transition hover:bg-red-500/15 dark:text-red-300 cursor-pointer"
                    >
                      <RiDeleteBinLine className="size-4" />
                      删除
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ProjectMetricCard
                  label="推进进度"
                  value={`${metrics.completionRate}%`}
                  hint={`${metrics.completedIssues} 已完成 · ${metrics.totalIssues} 有效`}
                  tone={metrics.completionRate >= 70 ? "success" : "default"}
                />
                <ProjectMetricCard
                  label="阻塞与延期"
                  value={`${metrics.blockedIssues + metrics.overdueIssues}`}
                  hint={`${metrics.blockedIssues} 阻塞 · ${metrics.overdueIssues} 延期`}
                  tone={
                    metrics.blockedIssues > 0
                      ? "danger"
                      : metrics.overdueIssues > 0
                        ? "warning"
                        : "success"
                  }
                />
                <ProjectMetricCard
                  label="关键执行面"
                  value={`${metrics.workflowIssueCount}`}
                  hint={`${metrics.workflowCount} 个关联流程 · ${metrics.highPriorityIssues} 个高优先级`}
                />
                <ProjectMetricCard
                  label="最近同步"
                  value={
                    selectedProject.lastSyncAt
                      ? formatRelativeTime(selectedProject.lastSyncAt)
                      : "未记录"
                  }
                  hint={
                    selectedProject.lastSyncAt
                      ? formatPreciseDate(selectedProject.lastSyncAt)
                      : "建议在关键评审或异步同步后更新"
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
            title="Project Workspace"
            // MARK: -- Workspace
            action={
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onCreateIssue}
                  className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-content-bg px-3 py-1 text-xs text-app-text-primary transition hover:bg-app-button-hover"
                >
                  <RiAddLine className="size-3.5" />
                  新建 Issue
                </button>
                <button
                  type="button"
                  onClick={handleCreateProjectDoc}
                  className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-content-bg px-3 py-1 text-xs text-app-text-primary transition hover:bg-app-button-hover"
                >
                  <RiFileList3Line className="size-3.5" />
                  新建文档
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
                  有效任务
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
                  Docs
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
                  Workflow
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
                  Sync
                </div>
                <div className="mt-3 text-2xl font-semibold text-app-text-primary">
                  {selectedProject.lastSyncAt
                    ? formatRelativeTime(selectedProject.lastSyncAt)
                    : "未记录"}
                </div>
              </button>
            </div>
          </ProjectPanel>
        </div>

        <div className="mt-4">
          <ProjectPanel
            title="Risks"
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
                  Blocked Issues
                </div>
                {blockedIssues.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-app-border bg-app-content-bg px-4 py-5 text-sm text-app-text-secondary">
                    当前没有被识别为阻塞中的任务。
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blockedIssues.map((issue) => (
                      <ProjectIssueRow
                        key={issue.id}
                        issue={issue}
                        onOpenIssue={openSummaryIssue}
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
