"use client";

import React, { useState } from "react";
import ConvexDocsProvider, {
  useConvexDocs,
  ConvexDocument,
} from "./ConvexDocsContext";
import ConvexDocsSidebar from "./ConvexDocsSidebar";
import ConvexDocsTabs from "./ConvexDocsTabs";
import ConvexDocsEditor from "./ConvexDocsEditor";
// import {
//   ResizablePanelGroup,
//   ResizablePanel,
//   ResizableHandle,
// } from "@/components/ui/resizable";

interface ConvexDocsPageProps {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  userId: string;
}

// 内部文档页面组件
function DocsPageContent() {
  const { documents, openDocs, activeDocId, openDoc, isLoading } =
    useConvexDocs();
  const [isExpanded, setIsExpanded] = useState(false);

  const activeDoc = openDocs.find((doc) => doc._id === activeDocId);

  const handleSelectDoc = (doc: ConvexDocument) => {
    openDoc(doc);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-app-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-app-text-muted">加载文档...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-app-bg flex">
      {/* Sidebar */}
      {!isExpanded && (
        <div className="w-64 flex-shrink-0">
          <ConvexDocsSidebar onSelectDoc={handleSelectDoc} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <ConvexDocsTabs onSelectDoc={handleSelectDoc} />

        {/* Content */}
        <div className="flex-1">
          {activeDoc ? (
            <ConvexDocsEditor
              doc={activeDoc}
              isExpanded={isExpanded}
              onToggleExpand={handleToggleExpand}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-app-bg">
              <div className="text-center">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 mx-auto text-app-text-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-app-text-primary mb-2">
                  欢迎使用文档系统
                </h3>
                <p className="text-app-text-muted max-w-sm">
                  {documents.length === 0
                    ? "还没有文档，点击侧边栏的 + 按钮开始创建"
                    : "从左侧选择一个文档开始编辑"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConvexDocsPage({
  workspaceId,
  workspaceType,
  userId,
}: ConvexDocsPageProps) {
  return (
    <ConvexDocsProvider
      workspaceId={workspaceId}
      workspaceType={workspaceType}
      userId={userId}
    >
      <DocsPageContent />
    </ConvexDocsProvider>
  );
}
