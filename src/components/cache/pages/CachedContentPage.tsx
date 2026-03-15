"use client";

import React from "react";
import TemplateScreen from "@/components/template/TemplateScreen";

export const CachedContentPage = React.memo(() => {
  return <TemplateScreen screen="content" />;
});

CachedContentPage.displayName = "CachedContentPage";
