"use client";

import React from "react";
import { RiExpandLeftRightLine, RiContractLeftRightLine } from "react-icons/ri";

interface DocsToolbarProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function DocsToolbar({
  isExpanded,
  onToggleExpand,
}: DocsToolbarProps) {
  return (
    <div className="absolute top-32 right-4 z-10">
      <div className="bg-app-content-bg border border-app-border rounded-lg shadow-lg dark:shadow-black/20 p-1">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-2 px-3 py-2 text-sm text-app-text-secondary hover:text-app-text-primary hover:bg-app-button-hover rounded-md transition-colors"
          title={isExpanded ? "收起编辑器" : "展开编辑器"}
        >
          {isExpanded ? (
            <>
              <RiContractLeftRightLine className="w-4 h-4" />
              收起
            </>
          ) : (
            <>
              <RiExpandLeftRightLine className="w-4 h-4" />
              展开
            </>
          )}
        </button>
      </div>
    </div>
  );
}
