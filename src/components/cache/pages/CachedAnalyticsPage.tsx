"use client";

import React from "react";
import TemplateScreen from "@/components/template/TemplateScreen";

export const CachedAnalyticsPage = React.memo(() => {
  return <TemplateScreen screen="analytics" />;
});

CachedAnalyticsPage.displayName = "CachedAnalyticsPage";
