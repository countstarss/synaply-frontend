"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { RiCloseLine, RiFileTextLine, RiFolder3Line } from "react-icons/ri";
import { useDocs, DocsDocument } from "./DocsContext";

interface DocsTabsProps {
  onSelectDoc: (doc: DocsDocument) => void;
}

export default function DocsTabs({ onSelectDoc }: DocsTabsProps) {
  const tDocs = useTranslations("docs");
  const { openDocs, activeDocId, closeDoc } = useDocs();

  if (openDocs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center border-b border-app-border bg-app-content-bg">
      <div className="flex items-center overflow-x-auto scrollbar-hidden select-none">
        {openDocs.map((doc) => {
          const isActive = doc._id === activeDocId;

          return (
            <div
              key={doc._id}
              className={`group flex min-w-0 cursor-pointer items-center gap-2 border-r border-app-border px-4 py-2 transition-colors ${
                isActive
                  ? "bg-app-bg text-app-text-primary"
                  : "text-app-text-secondary hover:bg-app-button-hover"
              }`}
              onClick={() => onSelectDoc(doc)}
            >
              {doc.type === "folder" ? (
                <RiFolder3Line className="w-4 h-4 flex-shrink-0" />
              ) : (
                <RiFileTextLine className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-sm truncate max-w-[150px] min-w-0">
                {doc.title}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeDoc(doc._id);
                }}
                className={`flex-shrink-0 rounded p-0.5 transition-opacity hover:bg-app-button-hover ${
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
                title={tDocs("tabs.close")}
              >
                <RiCloseLine className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Tab overflow indicator */}
      <div className="flex-1 h-full border-b-2 border-transparent" />
    </div>
  );
}
