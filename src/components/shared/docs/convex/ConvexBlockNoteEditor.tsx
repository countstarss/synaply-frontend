"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "../blocknote.css";
import { useConvexDocs, ConvexDocument } from "./ConvexDocsContext";

interface ConvexBlockNoteEditorProps {
  doc: ConvexDocument;
}

export default function ConvexBlockNoteEditor({
  doc,
}: ConvexBlockNoteEditorProps) {
  const { updateDocContent } = useConvexDocs();
  const [theme, setTheme] = useState<"light" | "dark">(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );

  // 监听主题变化
  useEffect(() => {
    const updateTheme = () => {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    };

    updateTheme();

    // 监听主题变化
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // 解析文档内容
  const initialContent = useMemo(() => {
    if (!doc.content) {
      return [
        {
          id: "initial",
          type: "paragraph",
          content: [],
        },
      ];
    }

    try {
      return JSON.parse(doc.content);
    } catch (error) {
      console.error("Failed to parse document content:", error);
      return [
        {
          id: "initial",
          type: "paragraph",
          content: [],
        },
      ];
    }
  }, [doc.content, doc._id]); // 依赖 doc._id 确保文档切换时重新解析

  // 创建 BlockNote 编辑器
  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent,
  });

  // 保存功能
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // 当文档切换时，更新编辑器内容
  useEffect(() => {
    if (editor && initialContent) {
      editor.replaceBlocks(editor.document, initialContent);
    }
  }, [editor, initialContent]);

  const handleSave = useCallback(async () => {
    if (isSaving || !editor || doc.type !== "document") return;

    setIsSaving(true);
    try {
      // 获取当前编辑器内容
      const blocks = editor.document;
      const content = JSON.stringify(blocks);

      // 保存到 Convex
      await updateDocContent(doc._id, content);
      setLastSaved(new Date());

      console.log("文档已保存");
    } catch (error) {
      console.error("保存失败:", error);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, editor, updateDocContent, doc._id, doc.type]);

  // 键盘快捷键保存
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault(); // 阻止浏览器默认保存行为
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSave]);

  // 自动保存 (可选)
  useEffect(() => {
    if (!editor) return;

    const autoSaveInterval = setInterval(() => {
      handleSave();
    }, 30000); // 每30秒自动保存

    return () => clearInterval(autoSaveInterval);
  }, [editor, handleSave]);

  // 只有文档类型才显示编辑器
  if (doc.type !== "document") {
    return null;
  }

  return (
    <div className="h-full w-full bg-app-content-bg">
      {/* Status Bar */}
      <div className="px-8 py-2 text-xs text-app-text-muted flex items-center justify-between bg-app-bg">
        <div className="flex items-center gap-4">
          {/* Save Status */}
          <div className="flex items-center gap-2">
            {isSaving ? (
              <span>保存中...</span>
            ) : lastSaved ? (
              <span>
                已保存 •{" "}
                {lastSaved.toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : (
              <span>准备就绪</span>
            )}
          </div>
        </div>

        <div className="text-xs text-app-text-muted">
          按 {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"} + S 保存 •
          30秒自动保存
        </div>
      </div>

      <BlockNoteView editor={editor} theme={theme} className="h-full" />
    </div>
  );
}
