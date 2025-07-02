"use client";

import React from "react";
import DocsProvider from "./_components/DocsProvider";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsProvider>{children}</DocsProvider>;
}
