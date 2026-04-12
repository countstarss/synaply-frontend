"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useDocs, DocsDocument } from "./DocsContext";
import DocsToolbar from "./DocsToolbar";
import FolderIntro from "./FolderIntro";

// 动态导入 BlockNote 编辑器以避免 SSR 问题
const DocsBlockNoteEditor = dynamic(() => import("./BlockNoteEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <p className="text-app-text-muted">加载编辑器...</p>
    </div>
  ),
});

interface DocsEditorProps {
  doc: DocsDocument;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function DocsEditor({
  doc,
  isExpanded = false,
  onToggleExpand,
}: DocsEditorProps) {
  const { updateDocTitle } = useDocs();
  const [title, setTitle] = useState(doc.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // 当doc改变时更新title状态
  useEffect(() => {
    setTitle(doc.title);
    setIsEditingTitle(false);
  }, [doc._id, doc.title]);

  const handleSaveTitle = async () => {
    if (isSavingTitle || title.trim() === doc.title) {
      setIsEditingTitle(false);
      return;
    }

    if (!title.trim()) {
      setTitle(doc.title);
      setIsEditingTitle(false);
      return;
    }

    setIsSavingTitle(true);
    try {
      await updateDocTitle(doc._id, title.trim());
      setIsEditingTitle(false);
    } catch (error) {
      console.error("更新标题失败:", error);
      setTitle(doc.title);
      setIsEditingTitle(false);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setTitle(doc.title);
    setIsEditingTitle(false);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-app-bg">
      {/* Toolbar */}
      {onToggleExpand && (
        <DocsToolbar isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
      )}

      {/* Title */}
      <div className="border-b border-app-border bg-app-content-bg px-8 py-[14.5px]">
        {isEditingTitle ? (
          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTitle();
                if (e.key === "Escape") handleCancelEdit();
              }}
              className="w-full border-b-2 border-sky-500 bg-transparent text-2xl font-semibold text-app-text-primary outline-none"
              autoFocus
              disabled={isSavingTitle || !doc.canEdit}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveTitle}
                disabled={isSavingTitle}
                className="rounded bg-sky-600 px-3 py-1 text-xs text-white transition-colors hover:bg-sky-500 disabled:bg-sky-400"
              >
                {isSavingTitle ? "保存中..." : "保存"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSavingTitle}
                className="px-3 py-1 text-xs text-app-text-secondary hover:text-app-text-primary border border-app-border rounded transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h1
              className={`text-2xl font-bold text-app-text-primary ${
                doc.canEdit
                  ? "cursor-pointer hover:bg-app-button-hover rounded px-2 py-1 -mx-2 -my-1"
                  : ""
              }`}
              onClick={() => {
                if (doc.canEdit) {
                  setIsEditingTitle(true);
                }
              }}
            >
              {title || "无标题文档"}
            </h1>
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-app-text-muted">
                {doc.canEdit
                  ? "点击标题可编辑"
                  : `${doc.type === "folder" ? "文件夹" : "文档"} • ${
                      doc.visibility === "PRIVATE"
                        ? "私有"
                        : doc.visibility === "TEAM_READONLY"
                        ? "团队只读"
                        : doc.visibility === "TEAM_EDITABLE"
                        ? "团队可编辑"
                        : "公开"
                    }`}
              </p>
              <p className="text-xs text-app-text-muted">
                更新于 {new Date(doc.updatedAt).toLocaleString("zh-CN")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {doc.type === "folder" ? (
          <FolderIntro folder={doc} />
        ) : (
          <DocsBlockNoteEditor doc={doc} />
        )}
      </div>
    </div>
  );
}
