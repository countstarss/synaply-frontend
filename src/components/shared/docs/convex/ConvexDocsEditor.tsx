"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useConvexDocs, ConvexDocument } from "./ConvexDocsContext";
import DocsToolbar from "../DocsToolbar";
import ConvexFolderIntro from "./ConvexFolderIntro";

// 动态导入 BlockNote 编辑器以避免 SSR 问题
const ConvexBlockNoteEditor = dynamic(() => import("./ConvexBlockNoteEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <p className="text-app-text-muted">加载编辑器...</p>
    </div>
  ),
});

interface ConvexDocsEditorProps {
  doc: ConvexDocument;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function ConvexDocsEditor({
  doc,
  isExpanded = false,
  onToggleExpand,
}: ConvexDocsEditorProps) {
  const { updateDocTitle } = useConvexDocs();
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
    <div className="h-full flex flex-col bg-app-bg relative">
      {/* Toolbar */}
      {onToggleExpand && (
        <DocsToolbar isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
      )}

      {/* Title */}
      <div className="px-8 py-[14.5px] border-b border-app-border bg-app-content-bg">
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
              className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 text-app-text-primary w-full outline-none"
              autoFocus
              disabled={isSavingTitle || !doc.canEdit}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveTitle}
                disabled={isSavingTitle}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded transition-colors"
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
      <div className="flex-1 overflow-hidden">
        {doc.type === "folder" ? (
          <ConvexFolderIntro folder={doc} />
        ) : (
          <ConvexBlockNoteEditor doc={doc} />
        )}
      </div>
    </div>
  );
}
