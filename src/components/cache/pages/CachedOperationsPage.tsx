"use client";

import React from "react";
import { AdminModulePage } from "@/components/admin/AdminModulePage";

export const CachedOperationsPage = React.memo(() => {
  return <AdminModulePage module="operations" />;
});

CachedOperationsPage.displayName = "CachedOperationsPage";
