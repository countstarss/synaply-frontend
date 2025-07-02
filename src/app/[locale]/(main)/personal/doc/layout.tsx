'use client';

import React from 'react';
import { DocsProvider } from '@/components/shared/docs';

export default function PersonalDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DocsProvider workspaceType="personal">
      {children}
    </DocsProvider>
  );
}