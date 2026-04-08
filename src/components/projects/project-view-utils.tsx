"use client";

import React from "react";
import { Globe2 } from "lucide-react";
import {
  RiAlarmWarningLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiFlag2Line,
  RiLockLine,
  RiRoadMapLine,
  RiSparklingLine,
  RiTeamLine,
  RiTimeLine,
} from "react-icons/ri";
import { priorityConfig, statusConfig } from "@/lib/data/issueConfig";
import type { Issue } from "@/lib/fetchers/issue";
import type {
  Project,
  ProjectVisibility,
} from "@/lib/fetchers/project";
import {
  ProjectRiskLevel,
  ProjectStatus,
} from "@/types/prisma";

export const VISIBILITY_META: Record<
  ProjectVisibility,
  {
    label: string;
    chipClassName: string;
    description: string;
    icon: React.ReactNode;
  }
> = {
  PRIVATE: {
    label: "Private",
    chipClassName:
      "border-slate-300/70 bg-slate-500/10 text-slate-700 dark:border-slate-700 dark:bg-slate-500/15 dark:text-slate-200",
    description: "默认适用于个人空间，当前权限并非严格按 visibility 做资源级过滤。",
    icon: <RiLockLine className="size-3.5" />,
  },
  TEAM_READONLY: {
    label: "Team Readonly",
    chipClassName:
      "border-sky-300/70 bg-sky-500/10 text-sky-700 dark:border-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
    description: "团队成员可以查看，实际写权限仍由 OWNER / ADMIN 控制。",
    icon: <RiTeamLine className="size-3.5" />,
  },
  TEAM_EDITABLE: {
    label: "Team Editable",
    chipClassName:
      "border-emerald-300/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
    description: "适合协作型项目，但当前后端仍按 workspace 成员角色做权限判断。",
    icon: <RiSparklingLine className="size-3.5" />,
  },
  PUBLIC: {
    label: "Public",
    chipClassName:
      "border-amber-300/70 bg-amber-500/10 text-amber-700 dark:border-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    description: "公开展示的项目视图，便于共享背景信息或状态。",
    icon: <Globe2 className="size-3.5" />,
  },
};

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  {
    label: string;
    chipClassName: string;
    icon: React.ReactNode;
  }
> = {
  PLANNING: {
    label: "规划中",
    chipClassName:
      "border-slate-300/70 bg-slate-500/10 text-slate-700 dark:border-slate-700 dark:bg-slate-500/15 dark:text-slate-200",
    icon: <RiRoadMapLine className="size-3.5" />,
  },
  ACTIVE: {
    label: "推进中",
    chipClassName:
      "border-sky-300/70 bg-sky-500/10 text-sky-700 dark:border-sky-800 dark:bg-sky-500/15 dark:text-sky-200",
    icon: <RiSparklingLine className="size-3.5" />,
  },
  BLOCKED: {
    label: "阻塞中",
    chipClassName:
      "border-rose-300/70 bg-rose-500/10 text-rose-700 dark:border-rose-800 dark:bg-rose-500/15 dark:text-rose-200",
    icon: <RiAlarmWarningLine className="size-3.5" />,
  },
  SHIPPING: {
    label: "发布中",
    chipClassName:
      "border-amber-300/70 bg-amber-500/10 text-amber-700 dark:border-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    icon: <RiTimeLine className="size-3.5" />,
  },
  DONE: {
    label: "已完成",
    chipClassName:
      "border-emerald-300/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
    icon: <RiCheckboxCircleLine className="size-3.5" />,
  },
  ARCHIVED: {
    label: "已归档",
    chipClassName:
      "border-zinc-300/70 bg-zinc-500/10 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-200",
    icon: <RiLockLine className="size-3.5" />,
  },
};

export const PROJECT_RISK_META: Record<
  ProjectRiskLevel,
  {
    label: string;
    chipClassName: string;
    icon: React.ReactNode;
  }
> = {
  LOW: {
    label: "低风险",
    chipClassName:
      "border-emerald-300/70 bg-emerald-500/10 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
    icon: <RiFlag2Line className="size-3.5" />,
  },
  MEDIUM: {
    label: "中风险",
    chipClassName:
      "border-amber-300/70 bg-amber-500/10 text-amber-700 dark:border-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    icon: <RiErrorWarningLine className="size-3.5" />,
  },
  HIGH: {
    label: "高风险",
    chipClassName:
      "border-orange-300/70 bg-orange-500/10 text-orange-700 dark:border-orange-800 dark:bg-orange-500/15 dark:text-orange-200",
    icon: <RiAlarmWarningLine className="size-3.5" />,
  },
  CRITICAL: {
    label: "关键风险",
    chipClassName:
      "border-rose-300/70 bg-rose-500/10 text-rose-700 dark:border-rose-800 dark:bg-rose-500/15 dark:text-rose-200",
    icon: <RiAlarmWarningLine className="size-3.5" />,
  },
};

export function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
  });
}

export function formatPreciseDate(date: string) {
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getProjectOwnerLabel(project?: Pick<Project, "owner"> | null) {
  const owner = project?.owner;

  if (!owner) {
    return "未指定负责人";
  }

  return owner.user.name || owner.user.email || "未命名成员";
}

export function getPriorityTone(issue: Issue) {
  if (!issue.priority) {
    return null;
  }

  return priorityConfig[issue.priority as keyof typeof priorityConfig] || null;
}

export function getIssueStateMeta(issue: Issue) {
  if (
    issue.currentStepStatus &&
    statusConfig[issue.currentStepStatus as keyof typeof statusConfig]
  ) {
    const workflowState =
      statusConfig[issue.currentStepStatus as keyof typeof statusConfig];

    return {
      label: workflowState.label,
      icon: workflowState.icon,
      className: workflowState.color,
    };
  }

  return {
    label: issue.state?.name || "未分类",
    icon: <span className="size-2 rounded-full bg-app-text-muted" />,
    className: "text-app-text-secondary",
  };
}
