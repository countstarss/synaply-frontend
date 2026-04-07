"use client";

import React from "react";
import { Globe2 } from "lucide-react";
import {
  RiLockLine,
  RiSparklingLine,
  RiTeamLine,
} from "react-icons/ri";
import { priorityConfig, statusConfig } from "@/lib/data/issueConfig";
import type { Issue } from "@/lib/fetchers/issue";
import type { ProjectVisibility } from "@/lib/fetchers/project";

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
