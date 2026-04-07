"use client";

import React from "react";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiEdit2Line,
  RiLoader4Line,
} from "react-icons/ri";
import { cn } from "@/lib/utils";
import type { Issue } from "@/lib/fetchers/issue";
import type { Project, ProjectDetail } from "@/lib/fetchers/project";
import {
  formatPreciseDate,
  formatShortDate,
  getIssueStateMeta,
  getPriorityTone,
} from "@/components/projects/project-view-utils";

interface ProjectDetailViewProps {
  selectedProject: Project | ProjectDetail;
  workspaceName: string;
  visibilityLabel: string;
  projectIssues: Issue[];
  isSelectionPending: boolean;
  isLoadingProjectDetail: boolean;
  isLoadingProjectIssues: boolean;
  canManageProjects: boolean;
  onBack: () => void;
  onCreateIssue: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenIssue: (issue: Issue) => void;
}

export function ProjectDetailView({
  selectedProject,
  workspaceName,
  visibilityLabel,
  projectIssues,
  isSelectionPending,
  isLoadingProjectDetail,
  isLoadingProjectIssues,
  canManageProjects,
  onBack,
  onCreateIssue,
  onEdit,
  onDelete,
  onOpenIssue,
}: ProjectDetailViewProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full px-8 py-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-full border border-app-border bg-app-content-bg px-3 py-1 text-xs font-medium text-app-text-secondary transition hover:bg-app-button-hover hover:text-app-text-primary"
        >
          <RiArrowLeftLine className="size-3.5" />
          返回项目概览
        </button>

        <div className="mt-4 flex flex-col gap-4 border-b border-app-border pb-5 sm:flex-row sm:items-start sm:justify-between">
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

        <div className="mt-6">
          <div className="mb-3 text-sm font-medium text-app-text-primary">
            Issues
          </div>

          {isLoadingProjectIssues ? (
            <div className="flex items-center justify-center py-14 text-app-text-secondary">
              <RiLoader4Line className="mr-2 size-5 animate-spin" />
              正在加载项目任务...
            </div>
          ) : projectIssues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-app-border bg-app-content-bg px-6 py-12 text-center">
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
          ) : (
            <div className="overflow-hidden rounded-2xl border border-app-border bg-app-content-bg">
              {projectIssues.map((issue) => {
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
                      {issue.dueDate && (
                        <span className="text-xs text-app-text-muted">
                          {formatShortDate(issue.dueDate)}
                        </span>
                      )}
                    </div>

                    <RiArrowRightSLine className="size-4 shrink-0 text-app-text-muted transition group-hover:translate-x-0.5 group-hover:text-app-text-primary" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
