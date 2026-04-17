"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import DocsPage from "@/components/shared/docs/DocsPage";
import { resolveProjectDocsContext } from "@/components/shared/docs/doc-navigation-utils";

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
  const searchParams = useSearchParams();
  const docsContext = resolveProjectDocsContext(
    workspaceType,
    searchParams.get("context"),
  );

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
    <div className="h-full overflow-hidden">
      <DocsPage
        workspaceId={workspaceId}
        workspaceType={workspaceType}
        userId={currentUserId}
        context={docsContext}
        projectId={projectId}
      />
    </div>
  );
}
