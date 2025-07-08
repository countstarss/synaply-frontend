"use client";

import React from "react";
import { RiCloseLine, RiFileTextLine, RiFolder3Line } from "react-icons/ri";
import { useConvexDocs, ConvexDocument } from "./ConvexDocsContext";

interface ConvexDocsTabsProps {
  onSelectDoc: (doc: ConvexDocument) => void;
}

export default function ConvexDocsTabs({ onSelectDoc }: ConvexDocsTabsProps) {
  const { openDocs, activeDocId, closeDoc } = useConvexDocs();

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
              className={`group flex items-center gap-2 px-4 py-2 border-r border-app-border cursor-pointer transition-colors min-w-0 ${
                isActive
                  ? "bg-app-bg text-app-text-primary"
                  : "hover:bg-app-button-hover text-app-text-secondary"
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
                className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity flex-shrink-0 ${
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
                title="关闭"
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
