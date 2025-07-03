"use client";

import React from "react";
import { DocsProvider, DocsSidebar, DocsTabs, useDocs } from "@/components/shared/docs";

function DocsContent({ children }: { children: React.ReactNode }) {
  const { docs, openDocs, activeDocId, openDoc, closeDoc } = useDocs();

  return (
    <div className="flex h-full">
      <DocsSidebar
        docs={docs}
        activeDocId={activeDocId}
        onSelectDoc={openDoc}
      />
      <div className="flex flex-col flex-1">
        <DocsTabs
          openDocs={openDocs}
          activeDocId={activeDocId}
          onSelectDoc={openDoc}
          onCloseDoc={closeDoc}
        />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

export default function TeamDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DocsProvider workspaceType="team">
      <DocsContent>{children}</DocsContent>
    </DocsProvider>
  );
}