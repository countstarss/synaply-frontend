"use client";

import React, { useState } from "react";
import {
  DocsProvider,
  DocsSidebar,
  DocsTabs,
  useDocs,
} from "@/components/shared/docs";
import { DocsExpandContext } from "@/hooks/useDocsExpand";

function DocsContent({ children }: { children: React.ReactNode }) {
  const { docs, openDocs, activeDocId, openDoc, closeDoc } = useDocs();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <DocsExpandContext.Provider
      value={{ isExpanded, onToggleExpand: toggleExpanded }}
    >
      <div className="flex h-full">
        {!isExpanded && (
          <DocsSidebar
            docs={docs}
            activeDocId={activeDocId}
            onSelectDoc={openDoc}
          />
        )}
        <div className="flex flex-col flex-1">
          {!isExpanded && (
            <DocsTabs
              openDocs={openDocs}
              activeDocId={activeDocId}
              onSelectDoc={openDoc}
              onCloseDoc={closeDoc}
            />
          )}
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </DocsExpandContext.Provider>
  );
}

export default function PersonalDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DocsProvider workspaceType="personal">
      <DocsContent>{children}</DocsContent>
    </DocsProvider>
  );
}
