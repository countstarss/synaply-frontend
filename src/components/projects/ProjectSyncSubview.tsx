"use client";

import React, { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RiLoader4Line, RiLoopLeftLine } from "react-icons/ri";
import { ProjectActivityTimeline } from "@/components/projects/ProjectActivityTimeline";
import { ProjectSurfaceCard } from "@/components/projects/ProjectSurfaceCard";
import {
  buildProjectTimelineEntries,
  formatProjectRelativeTime,
} from "@/components/projects/project-activity-utils";
import type { Issue } from "@/lib/fetchers/issue";
import type {
  Project,
  ProjectActivityItem,
  ProjectDetail,
} from "@/lib/fetchers/project";

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
  const timelineEntries = useMemo(
    () =>
      buildProjectTimelineEntries({
        selectedProject,
        recentActivity,
        projectIssues,
      }),
    [projectIssues, recentActivity, selectedProject],
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
              <div className="text-xs text-app-text-muted">
                {tProjects("subviews.sync.recentSync")}
              </div>
              <div className="mt-2 text-lg font-semibold text-app-text-primary">
                {selectedProject.lastSyncAt
                  ? formatProjectRelativeTime(
                      selectedProject.lastSyncAt,
                      tProjects,
                      locale,
                      "subviews.relativeTime",
                    )
                  : tProjects("subviews.sync.notRecorded")}
              </div>
            </div>
            <div className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-3">
              <div className="text-xs text-app-text-muted">
                {tProjects("subviews.sync.activityCount")}
              </div>
              <div className="mt-2 text-lg font-semibold text-app-text-primary">
                {timelineEntries.length}
              </div>
            </div>
            <div className="rounded-2xl border border-app-border bg-app-bg/70 px-4 py-3">
              <div className="text-xs text-app-text-muted">
                {tProjects("subviews.sync.updatedAt")}
              </div>
              <div className="mt-2 text-lg font-semibold text-app-text-primary">
                {formatProjectRelativeTime(
                  selectedProject.updatedAt,
                  tProjects,
                  locale,
                  "subviews.relativeTime",
                )}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <ProjectActivityTimeline
              entries={timelineEntries}
              locale={locale}
              tProjects={tProjects}
              relativeTimePrefix="subviews.relativeTime"
              emptyText={tProjects("subviews.sync.empty")}
              syncTitle={tProjects("subviews.sync.timeline.syncTitle")}
              syncDescription={tProjects("subviews.sync.timeline.syncDescription")}
              actorFallbackLabel={tProjects("subviews.sync.teamMember")}
              onOpenIssue={onOpenIssue}
            />
          </div>
        </div>
      </ProjectSurfaceCard>
    </div>
  );
}
