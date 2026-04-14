"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { RiExpandLeftRightLine, RiContractLeftRightLine } from "react-icons/ri";

interface DocsToolbarProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function DocsToolbar({
  isExpanded,
  onToggleExpand,
}: DocsToolbarProps) {
  const tDocs = useTranslations("docs");

  return (
    <div className="absolute top-32 right-4 z-10">
      <div className="rounded-xl border border-app-border bg-app-content-bg p-1 shadow-[0_16px_36px_rgba(15,23,42,0.12)] dark:shadow-black/20">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-2 px-3 py-2 text-sm text-app-text-secondary hover:text-app-text-primary hover:bg-app-button-hover rounded-md transition-colors"
          title={isExpanded ? tDocs("toolbar.collapseTitle") : tDocs("toolbar.expandTitle")}
        >
          {isExpanded ? (
            <>
              <RiContractLeftRightLine className="w-4 h-4" />
              {tDocs("toolbar.collapse")}
            </>
          ) : (
            <>
              <RiExpandLeftRightLine className="w-4 h-4" />
              {tDocs("toolbar.expand")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
