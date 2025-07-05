"use client";

import React from "react";
import { RiFileTextLine, RiFolder3Line, RiAddLine } from "react-icons/ri";
import { useDocs } from "@/components/shared/docs";
import DocsEditor from "@/components/shared/docs/DocsEditor";
import FolderIntro from "@/components/shared/docs/FolderIntro";
import { useDocsExpand } from "@/hooks/useDocsExpand";

export default function TeamDocPage() {
  const { docs, activeDocId, openDoc, createDoc } = useDocs();
  const { isExpanded, onToggleExpand } = useDocsExpand();

  // 根据 activeDocId 查找当前激活的文档
  const activeDoc = docs.find((d) => d.uid === activeDocId);

  // 获取根文档和最近更新的文档
  const rootDocs = docs.filter((doc) => !doc.parentId);
  const recentDocs = [...docs]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  const handleSelectDoc = (doc: (typeof docs)[0]) => {
    openDoc(doc);
  };

  const handleCreateNewDoc = async () => {
    await createDoc("新文档", null);
  };

  // 如果没有激活的文档，显示概览页面
  if (!activeDoc) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-app-text-primary mb-2">
              团队文档
            </h1>
            <p className="text-app-text-secondary">
              共有{" "}
              <span className="font-semibold text-app-text-primary">
                {docs.length}
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
                  {docs.length}
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
                  {rootDocs.length}
                </span>
              </div>
              <p className="text-sm text-app-text-secondary">文档分类</p>
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
                创建新的团队文档
              </p>
            </button>
          </div>

          {/* Document Categories */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-app-text-primary mb-4">
              文档分类
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rootDocs.map((doc) => {
                const childCount = docs.filter(
                  (d) => d.parentId === doc.uid
                ).length;
                return (
                  <div
                    key={doc.uid}
                    onClick={() => handleSelectDoc(doc)}
                    className="p-4 bg-app-content-bg border border-app-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <RiFolder3Line className="w-5 h-5 text-app-text-secondary mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-app-text-primary mb-1">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-app-text-secondary">
                          {childCount > 0
                            ? `包含 ${childCount} 个文档`
                            : "空文件夹"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Documents */}
          <div>
            <h2 className="text-xl font-semibold text-app-text-primary mb-4">
              最近更新
            </h2>
            <div className="space-y-2">
              {recentDocs.map((doc) => (
                <div
                  key={doc.uid}
                  onClick={() => handleSelectDoc(doc)}
                  className="flex items-center gap-3 p-3 bg-app-content-bg border border-app-border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                >
                  <RiFileTextLine className="w-4 h-4 text-app-text-secondary" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-app-text-primary">
                      {doc.title}
                    </h4>
                    <p className="text-xs text-app-text-muted">
                      更新于{" "}
                      {new Date(doc.updatedAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                  {doc.parentId && (
                    <span className="text-xs text-app-text-secondary bg-app-button-hover px-2 py-1 rounded">
                      {docs.find((d) => d.uid === doc.parentId)?.title}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 如果有激活的文档，根据类型渲染 DocsEditor 或 FolderIntro
  if (activeDoc.type === "folder") {
    return <FolderIntro folder={activeDoc} />;
  }

  return (
    <DocsEditor
      doc={activeDoc}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    />
  );
}
