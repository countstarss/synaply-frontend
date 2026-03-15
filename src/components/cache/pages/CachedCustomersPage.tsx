"use client";

import React from "react";
import TemplateScreen from "@/components/template/TemplateScreen";

export const CachedCustomersPage = React.memo(() => {
  return <TemplateScreen screen="customers" />;
});

CachedCustomersPage.displayName = "CachedCustomersPage";
