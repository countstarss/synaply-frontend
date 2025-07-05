"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Doc } from "@/lib/db";
import { useDocs } from "./DocsContext";
import DocsToolbar from "./DocsToolbar";

// 动态导入 BlockNote 以避免 SSR 问题
const BlockNoteEditor = dynamic(() => import("./BlockNoteEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <p className="text-app-text-muted">加载编辑器...</p>
    </div>
  ),
});

interface DocsEditorProps {
  doc: Doc;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function DocsEditor({
  doc,
  isExpanded = false,
  onToggleExpand,
}: DocsEditorProps) {
  const { workspaceType } = useDocs();
  const [title, setTitle] = useState(doc.title);

  // 当doc改变时更新title状态
  useEffect(() => {
    setTitle(doc.title);
  }, [doc.uid, doc.title]);

  return (
    <div className="h-full flex flex-col bg-app-bg relative">
      {/* Toolbar */}
      {onToggleExpand && (
        <DocsToolbar isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
      )}

      {/* Title */}
      <div className="px-8 py-[14.5px] border-b border-app-border bg-app-content-bg">
        <h1 className="text-2xl font-bold bg-transparent text-app-text-primary w-full">
          {title || "无标题文档"}
        </h1>
        <p className="text-sm text-app-text-muted mt-1">
          在侧边栏右键菜单中重命名文档
        </p>
      </div>

      {/* BlockNote Editor */}
      <div className="flex-1 overflow-hidden">
        <BlockNoteEditor doc={doc} workspaceType={workspaceType} />
      </div>
    </div>
  );
}
