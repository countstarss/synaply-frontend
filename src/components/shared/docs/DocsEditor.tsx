"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useDocs, DocsDocument } from "./DocsContext";
import DocsToolbar from "./DocsToolbar";
import FolderIntro from "./FolderIntro";

function DocsEditorLoadingState() {
  const tDocs = useTranslations("docs");

  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-app-text-muted">{tDocs("states.loadingEditor")}</p>
    </div>
  );
}

const DocsBlockNoteEditor = dynamic(() => import("./BlockNoteEditor"), {
  ssr: false,
  loading: () => <DocsEditorLoadingState />,
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
  const tDocs = useTranslations("docs");
  const locale = useLocale();
  const { updateDocTitle } = useDocs();
  const [title, setTitle] = useState(doc.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);

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
      console.error("Failed to update the document title:", error);
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
      {onToggleExpand && (
        <DocsToolbar isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
      )}

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
                {isSavingTitle ? tDocs("editor.saving") : tDocs("editor.save")}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSavingTitle}
                className="px-3 py-1 text-xs text-app-text-secondary hover:text-app-text-primary border border-app-border rounded transition-colors"
              >
                {tDocs("editor.cancel")}
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
              {title || tDocs("editor.untitled")}
            </h1>
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-app-text-muted">
                {doc.canEdit
                  ? tDocs("editor.clickToEdit")
                  : `${doc.type === "folder" ? tDocs("editor.meta.folder") : tDocs("editor.meta.document")} • ${
                      doc.visibility === "PRIVATE"
                        ? tDocs("editor.meta.private")
                        : doc.visibility === "TEAM_READONLY"
                        ? tDocs("editor.meta.teamReadonly")
                        : doc.visibility === "TEAM_EDITABLE"
                        ? tDocs("editor.meta.teamEditable")
                        : tDocs("editor.meta.public")
                    }`}
              </p>
              <p className="text-xs text-app-text-muted">
                {tDocs("editor.updatedAt", {
                  value: new Date(doc.updatedAt).toLocaleString(locale),
                })}
              </p>
            </div>
          </div>
        )}
      </div>

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
