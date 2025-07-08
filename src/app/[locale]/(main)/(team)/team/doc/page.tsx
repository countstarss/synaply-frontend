"use client";

import React from "react";
import ConvexDocsPage from "@/components/shared/docs/convex/ConvexDocsPage";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUserInfo } from "@/hooks/useUser";

// NOTE: 主导出组件 - 团队文档页面
export default function TeamDocPage() {
  const { currentWorkspace } = useWorkspace();
  const { data: userInfo } = useUserInfo(currentWorkspace?.userId || "");

  const workspaceId = currentWorkspace?.id || "";
  const workspaceType = currentWorkspace?.type || "TEAM";
  const userId = userInfo?.id || "";
  const context = "team" as const;

  return (
    <div className="h-full">
      <ConvexDocsPage
        workspaceId={workspaceId}
        workspaceType={workspaceType}
        userId={userId}
        context={context}
      />
    </div>
  );
}
