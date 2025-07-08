"use client";

import React from "react";
import ConvexDocsPage from "@/components/shared/docs/convex/ConvexDocsPage";
import { useWorkspace } from "@/hooks/useWorkspace";

// 主导出组件
export const CachedDocsPage = React.memo(() => {
  const { currentWorkspace } = useWorkspace();

  const workspaceId = currentWorkspace?.id || "";
  const workspaceType =
    currentWorkspace?.type === "PERSONAL" ? "PERSONAL" : "TEAM";
  const userId = currentWorkspace?.userId || "";
  const context = currentWorkspace?.type === "PERSONAL" ? "personal" : "team";
  const projectId = "";

  return (
    <div className="h-full">
      <ConvexDocsPage
        workspaceId={workspaceId}
        workspaceType={workspaceType}
        userId={userId}
        context={context}
        projectId={projectId}
      />
    </div>
  );
});

CachedDocsPage.displayName = "CachedDocsPage";
