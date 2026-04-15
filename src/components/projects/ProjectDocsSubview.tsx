"use client";

import React from "react";
import { useTranslations } from "next-intl";
import DocsPage from "@/components/shared/docs/DocsPage";

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
