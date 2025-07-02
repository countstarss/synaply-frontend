"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Doc } from "@/lib/db";
import { useDocs } from "./DocsContext";

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
}

export default function DocsEditor({ doc }: DocsEditorProps) {
  const { updateDocTitle, workspaceType } = useDocs();
  const [title, setTitle] = useState(doc.title);

  const handleTitleChange = async (newTitle: string) => {
    setTitle(newTitle);
    await updateDocTitle(doc.uid, newTitle);
  };

  return (
    <div className="h-full flex flex-col bg-app-bg">
      {/* Title */}
      <div className="px-8 py-[14.5px] border-b border-app-border bg-app-content-bg">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-2xl font-bold bg-transparent text-app-text-primary outline-none w-full"
          placeholder="无标题文档"
        />
      </div>

      {/* BlockNote Editor */}
      <div className="flex-1 overflow-hidden">
        <BlockNoteEditor doc={doc} workspaceType={workspaceType} />
      </div>
    </div>
  );
}
