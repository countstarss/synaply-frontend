"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BlockNoteEditor } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "./blocknote.css";
import { useDocs, DocsDocument } from "./DocsContext";
import { db } from "@/lib/db";

interface BlockNoteEditorProps {
  doc: DocsDocument;
}

function getEmptyContent() {
  return [
    {
      id: "initial",
      type: "paragraph",
      content: [],
    },
  ];
}

export default function DocsBlockNoteEditor({
  doc,
}: BlockNoteEditorProps) {
  const { updateDocContent } = useDocs();
  const draftSaveTimeoutRef = useRef<number | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
      ? "dark"
      : "light"
  );

  useEffect(() => {
    const updateTheme = () => {
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const initialContent = useMemo(() => {
    if (!doc.content) {
      return getEmptyContent();
    }

    try {
      return JSON.parse(doc.content);
    } catch (error) {
      console.error("Failed to parse document content:", error);
      return getEmptyContent();
    }
  }, [doc.content]);

  const [hydratedContent, setHydratedContent] = useState(initialContent);
  const [isDraftRecovered, setIsDraftRecovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<
    "ready" | "draft" | "saving" | "saved" | "error" | "conflict"
  >("ready");
  const [lastError, setLastError] = useState<string | null>(null);

  const editor: BlockNoteEditor = useCreateBlockNote({
    initialContent: hydratedContent,
  });

  const buildMetadataSnapshot = useCallback(
    () =>
      JSON.stringify({
        title: doc.title,
        icon: doc.icon ?? null,
        coverImage: doc.coverImage ?? null,
        visibility: doc.visibility,
      }),
    [doc.coverImage, doc.icon, doc.title, doc.visibility]
  );

  useEffect(() => {
    let mounted = true;

    const hydrateDraft = async () => {
      setHydratedContent(initialContent);
      setIsDraftRecovered(false);
      setSyncStatus("ready");
      setLastError(null);

      const draft = await db.docDrafts.get(doc._id);
      if (!mounted || !draft) {
        return;
      }

      try {
        setHydratedContent(JSON.parse(draft.localContentSnapshot));
        setIsDraftRecovered(true);
        setSyncStatus("draft");
      } catch (error) {
        console.error("Failed to restore local doc draft:", error);
      }
    };

    void hydrateDraft();

    return () => {
      mounted = false;
    };
  }, [doc._id, initialContent]);

  useEffect(() => {
    if (editor && hydratedContent) {
      editor.replaceBlocks(editor.document, hydratedContent);
    }
  }, [editor, hydratedContent]);

  const persistLocalDraft = useCallback(async () => {
    if (!editor || doc.type !== "document") return;

    const content = JSON.stringify(editor.document);

    await db.docDrafts.put({
      docId: doc._id,
      baseRevisionId: doc.latestRevisionId ?? null,
      localContentSnapshot: content,
      localMetadataSnapshot: buildMetadataSnapshot(),
      updatedAt: Date.now(),
    });

    await db.docSyncStates.put({
      docId: doc._id,
      lastSyncedRevisionId: doc.latestRevisionId ?? null,
      syncStatus: "draft",
      lastError: null,
      updatedAt: Date.now(),
    });
  }, [buildMetadataSnapshot, doc._id, doc.latestRevisionId, doc.type, editor]);

  const handleSave = useCallback(async () => {
    if (isSaving || !editor || doc.type !== "document") return;

    setIsSaving(true);
    setSyncStatus("saving");
    setLastError(null);

    try {
      const content = JSON.stringify(editor.document);
      const metadataSnapshot = buildMetadataSnapshot();

      await db.docDrafts.put({
        docId: doc._id,
        baseRevisionId: doc.latestRevisionId ?? null,
        localContentSnapshot: content,
        localMetadataSnapshot: metadataSnapshot,
        updatedAt: Date.now(),
      });

      const result = await updateDocContent(doc._id, content);

      if (result.status === "conflict") {
        await db.docConflicts.add({
          docId: doc._id,
          serverRevisionId: result.serverRevisionId ?? null,
          clientMutationId: null,
          serverSnapshot: result.serverSnapshot ?? null,
          localSnapshot: content,
          updatedAt: Date.now(),
        });

        await db.docSyncStates.put({
          docId: doc._id,
          lastSyncedRevisionId: doc.latestRevisionId ?? null,
          syncStatus: "conflict",
          lastError: "远端版本已更新，本地草稿已保留",
          updatedAt: Date.now(),
        });

        setSyncStatus("conflict");
        setLastError("远端版本已更新，本地草稿已保留");
        return;
      }

      await db.docDrafts.delete(doc._id);
      await db.docsCache.put({
        docId: doc._id,
        latestRevisionId: result.doc.latestRevisionId ?? null,
        contentSnapshot: content,
        metadataSnapshot,
        updatedAt: Date.now(),
      });
      await db.docSyncStates.put({
        docId: doc._id,
        lastSyncedRevisionId: result.doc.latestRevisionId ?? null,
        lastSyncAt: Date.now(),
        syncStatus: "saved",
        lastError: null,
        updatedAt: Date.now(),
      });

      setLastSaved(new Date());
      setIsDraftRecovered(false);
      setSyncStatus("saved");
    } catch (error) {
      console.error("保存失败:", error);
      const message = error instanceof Error ? error.message : "保存失败";
      setSyncStatus("error");
      setLastError(message);

      await db.docSyncStates.put({
        docId: doc._id,
        lastSyncedRevisionId: doc.latestRevisionId ?? null,
        syncStatus: "error",
        lastError: message,
        updatedAt: Date.now(),
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    buildMetadataSnapshot,
    doc._id,
    doc.latestRevisionId,
    doc.type,
    editor,
    isSaving,
    updateDocContent,
  ]);

  const handleDocumentChange = useCallback(() => {
    setSyncStatus((current) => (current === "conflict" ? current : "draft"));

    if (draftSaveTimeoutRef.current) {
      window.clearTimeout(draftSaveTimeoutRef.current);
    }

    draftSaveTimeoutRef.current = window.setTimeout(() => {
      void persistLocalDraft();
    }, 600);
  }, [persistLocalDraft]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        void handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSave]);

  useEffect(() => {
    if (!editor) return;

    const autoSaveInterval = setInterval(() => {
      void handleSave();
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [editor, handleSave]);

  useEffect(() => {
    return () => {
      if (draftSaveTimeoutRef.current) {
        window.clearTimeout(draftSaveTimeoutRef.current);
      }
    };
  }, []);

  if (doc.type !== "document") {
    return null;
  }

  return (
    <div className="h-full w-full bg-app-content-bg">
      <div className="flex items-center justify-between bg-app-bg px-8 py-2 text-xs text-app-text-muted">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isSaving ? (
              <span>保存中...</span>
            ) : syncStatus === "conflict" ? (
              <span>检测到冲突，本地草稿已保留</span>
            ) : syncStatus === "error" ? (
              <span>保存失败，草稿已保留在本地</span>
            ) : syncStatus === "draft" ? (
              <span>{isDraftRecovered ? "已恢复本地草稿" : "本地草稿待同步"}</span>
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

        <div className="text-right text-xs text-app-text-muted">
          <div>
            按 {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"} + S 保存 •
            30秒自动保存
          </div>
          {lastError && <div className="mt-0.5 text-amber-500">{lastError}</div>}
        </div>
      </div>

      <BlockNoteView
        editor={editor}
        theme={theme}
        className="h-full"
        onChange={handleDocumentChange}
      />
    </div>
  );
}
