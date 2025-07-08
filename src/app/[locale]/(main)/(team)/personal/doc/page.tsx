"use client";

import React from "react";
import { RiFileTextLine, RiFolder3Line, RiAddLine } from "react-icons/ri";
import ConvexDocsPage from "@/components/shared/docs/convex/ConvexDocsPage";
import {
  useConvexDocs,
  ConvexDocument,
} from "@/components/shared/docs/convex/ConvexDocsContext";
import ConvexDocsProvider from "@/components/shared/docs/convex/ConvexDocsContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useUserInfo } from "@/hooks/useUser";

// 个人文档概览页面组件
function PersonalDocsOverviewPage() {
  const { documents, createDoc, openDoc } = useConvexDocs();

  // 获取根文档和最近更新的文档
  const rootDocs = documents.filter((doc) => !doc.parentDocument);
  const recentDocs = [...documents]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  const handleSelectDoc = (doc: ConvexDocument) => {
    openDoc(doc);
  };

  const handleCreateNewDoc = async () => {
    await createDoc("新个人文档");
  };

  return (
    <div className="flex-1 overflow-y-auto h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-app-text-primary mb-2">
            我的工作文档
          </h1>
          <p className="text-app-text-secondary">
            共有{" "}
            <span className="font-semibold text-app-text-primary">
              {documents.length}
            </span>{" "}
            个个人工作文档
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-app-content-bg border border-app-border rounded-lg text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                <RiFileTextLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-semibold text-app-text-primary">
                {documents.filter((doc) => doc.type === "document").length}
              </span>
            </div>
            <p className="text-sm text-app-text-secondary">工作文档数</p>
          </div>

          <div className="p-4 bg-app-content-bg border border-app-border rounded-lg text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded">
                <RiFolder3Line className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-semibold text-app-text-primary">
                {documents.filter((doc) => doc.type === "folder").length}
              </span>
            </div>
            <p className="text-sm text-app-text-secondary">文件夹数</p>
          </div>

          <button
            onClick={handleCreateNewDoc}
            className="p-4 bg-app-content-bg border border-app-border rounded-lg hover:shadow-md transition-shadow text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded">
                <RiAddLine className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-lg font-semibold text-app-text-primary">
                新建文档
              </span>
            </div>
            <p className="text-sm text-app-text-secondary">
              创建新的个人工作文档
            </p>
          </button>
        </div>

        {/* Document Categories */}
        {rootDocs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-app-text-primary mb-4">
              文档分类
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rootDocs.map((doc) => {
                const childCount = documents.filter(
                  (d) => d.parentDocument === doc._id
                ).length;
                return (
                  <div
                    key={doc._id}
                    onClick={() => handleSelectDoc(doc)}
                    className="p-4 bg-app-content-bg border border-app-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {doc.type === "folder" ? (
                        <RiFolder3Line className="w-5 h-5 text-app-text-secondary mt-0.5" />
                      ) : (
                        <RiFileTextLine className="w-5 h-5 text-app-text-secondary mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-app-text-primary mb-1">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-app-text-secondary">
                          {doc.type === "folder"
                            ? childCount > 0
                              ? `包含 ${childCount} 个项目`
                              : "空文件夹"
                            : `更新于 ${new Date(
                                doc.updatedAt
                              ).toLocaleDateString("zh-CN")}`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Documents */}
        {recentDocs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-app-text-primary mb-4">
              最近更新
            </h2>
            <div className="space-y-2">
              {recentDocs.map((doc) => {
                const parentDoc = doc.parentDocument
                  ? documents.find((d) => d._id === doc.parentDocument)
                  : null;

                return (
                  <div
                    key={doc._id}
                    onClick={() => handleSelectDoc(doc)}
                    className="flex items-center gap-3 p-3 bg-app-content-bg border border-app-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  >
                    {doc.type === "folder" ? (
                      <RiFolder3Line className="w-4 h-4 text-app-text-secondary" />
                    ) : (
                      <RiFileTextLine className="w-4 h-4 text-app-text-secondary" />
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-app-text-primary">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-app-text-muted">
                        更新于{" "}
                        {new Date(doc.updatedAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    {parentDoc && (
                      <span className="text-xs text-app-text-secondary bg-app-button-hover px-2 py-1 rounded">
                        {parentDoc.title}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents.length === 0 && (
          <div className="text-center py-16">
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
              还没有个人工作文档
            </h3>
            <p className="text-app-text-muted mb-4">
              在团队工作空间中创建个人文档，只有你可以访问
            </p>
            <button
              onClick={handleCreateNewDoc}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RiAddLine className="w-4 h-4" />
              创建个人文档
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 结合了概览页面和 Convex 文档系统的组件
function PersonalDocsPageWithOverview({
  workspaceId,
  workspaceType,
  userId,
  context,
  projectId,
}: {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  userId: string;
  context: "team-personal";
  projectId?: string;
}) {
  const { activeDocId, openDocs } = useConvexDocs();

  // 如果没有激活的文档且没有打开的文档，显示概览页面
  if (!activeDocId && openDocs.length === 0) {
    return <PersonalDocsOverviewPage />;
  }

  // 否则显示完整的文档系统
  return (
    <ConvexDocsPage
      workspaceId={workspaceId}
      workspaceType={workspaceType}
      userId={userId}
      context={context}
      projectId={projectId}
    />
  );
}

// NOTE: 主导出组件 - 个人文档页面（在团队工作空间中）
export default function PersonalDocPage() {
  // TODO: 从实际的认证和工作空间上下文中获取这些值
  const { currentWorkspace } = useWorkspace();
  const { data: user } = useUserInfo(currentWorkspace?.userId || "");

  const workspaceId = currentWorkspace?.id || ""; // 应该从路由或上下文中获取（注意这是团队工作空间ID）
  const workspaceType = currentWorkspace?.type || "TEAM"; // 虽然是个人文档，但在团队工作空间中
  const userId = user?.id || ""; // 应该从认证上下文中获取
  const context = "team-personal" as const; // 团队工作空间中的个人文档上下文

  return (
    <div className="h-full">
      <ConvexDocsProvider
        workspaceId={workspaceId}
        workspaceType={workspaceType}
        userId={userId}
        context={context}
      >
        <PersonalDocsPageWithOverview
          workspaceId={workspaceId}
          workspaceType={workspaceType}
          userId={userId}
          context={context}
        />
      </ConvexDocsProvider>
    </div>
  );
}
