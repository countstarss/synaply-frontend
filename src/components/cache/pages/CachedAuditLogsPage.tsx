"use client";

import React from "react";
import { AdminModulePage } from "@/components/admin/AdminModulePage";

export const CachedAuditLogsPage = React.memo(() => {
  return <AdminModulePage module="audit-logs" />;
});

CachedAuditLogsPage.displayName = "CachedAuditLogsPage";
