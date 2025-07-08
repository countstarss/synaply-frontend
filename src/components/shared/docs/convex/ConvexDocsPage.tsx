"use client";

import React, { useState } from "react";
import { RiFileTextLine, RiFolder3Line, RiAddLine } from "react-icons/ri";
import ConvexDocsProvider, {
  useConvexDocs,
  ConvexDocument,
  DocumentContext,
} from "./ConvexDocsContext";
import ConvexDocsSidebar from "./ConvexDocsSidebar";
import ConvexDocsTabs from "./ConvexDocsTabs";
import ConvexDocsEditor from "./ConvexDocsEditor";
import { useWorkspace } from "@/hooks/useWorkspace";
// import {
//   ResizablePanelGroup,
//   ResizablePanel,
//   ResizableHandle,
// } from "@/components/ui/resizable";

interface ConvexDocsPageProps {
  workspaceId: string;
  workspaceType: "PERSONAL" | "TEAM";
  userId: string;
  context?: DocumentContext; // 可选，如果不提供则自动检测
  projectId?: string;
}

// MARK: - 文档概览页面组件
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
    await createDoc("新文档");
  };

  return (
    <div className="flex-1 overflow-y-auto h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-app-text-primary mb-2">
            我的文档
          </h1>
          <p className="text-app-text-secondary">
            共有{" "}
            <span className="font-semibold text-app-text-primary">
              {documents.length}
            </span>{" "}
            个个人文档
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
            <p className="text-sm text-app-text-secondary">文档数</p>
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
            <p className="text-sm text-app-text-secondary">创建新的个人文档</p>
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
              还没有文档
            </h3>
            <p className="text-app-text-muted mb-4">
              创建你的第一个文档开始记录想法
            </p>
            <button
              onClick={handleCreateNewDoc}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RiAddLine className="w-4 h-4" />
              创建文档
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// MARK: - 团队文档概览
function TeamDocsOverviewPage() {
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
    await createDoc("新团队文档");
  };

  return (
    <div className="flex-1 overflow-y-auto h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-app-text-primary mb-2">
            团队文档
          </h1>
          <p className="text-app-text-secondary">
            共有{" "}
            <span className="font-semibold text-app-text-primary">
              {documents.length}
            </span>{" "}
            个团队文档
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
            <p className="text-sm text-app-text-secondary">团队文档数</p>
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
            <p className="text-sm text-app-text-secondary">创建新的团队文档</p>
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
              还没有团队文档
            </h3>
            <p className="text-app-text-muted mb-4">
              创建第一个团队文档，与团队成员协作
            </p>
            <button
              onClick={handleCreateNewDoc}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RiAddLine className="w-4 h-4" />
              创建团队文档
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// MARK: - 团队个人文档概览
function TeamPersonalDocsOverviewPage() {
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

// MARK: - 根据context渲染
function DocsOverviewPage({ context }: { context: DocumentContext }) {
  switch (context) {
    case "personal":
      return <PersonalDocsOverviewPage />;
    case "team":
      return <TeamDocsOverviewPage />;
    case "team-personal":
      return <TeamPersonalDocsOverviewPage />;
    default:
      return <PersonalDocsOverviewPage />;
  }
}

// MARK: - 内部文档页面组件
function DocsPageContent() {
  const { documents, openDocs, activeDocId, openDoc, isLoading, context } =
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

  // 如果没有激活文档且没有打开的文档，显示概览页面
  if (!activeDocId && openDocs.length === 0) {
    return <DocsOverviewPage context={context} />;
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
  context,
  projectId,
}: ConvexDocsPageProps) {
  const { currentWorkspace } = useWorkspace();

  // 如果没有提供 context，则根据工作空间类型自动检测
  const documentContext: DocumentContext =
    context ||
    (currentWorkspace?.type === "PERSONAL"
      ? "personal"
      : currentWorkspace?.type === "TEAM"
      ? "team"
      : "team-personal");

  return (
    <ConvexDocsProvider
      context={documentContext}
      workspaceId={workspaceId}
      workspaceType={workspaceType}
      userId={userId}
      projectId={projectId}
    >
      <DocsPageContent />
    </ConvexDocsProvider>
  );
}
