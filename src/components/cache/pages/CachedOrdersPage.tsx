"use client";

import React from "react";
import TemplateScreen from "@/components/template/TemplateScreen";

export const CachedOrdersPage = React.memo(() => {
  return <TemplateScreen screen="orders" />;
});

CachedOrdersPage.displayName = "CachedOrdersPage";
