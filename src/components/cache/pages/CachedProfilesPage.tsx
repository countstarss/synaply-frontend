"use client";

import React from "react";
import { AdminModulePage } from "@/components/admin/AdminModulePage";

export const CachedProfilesPage = React.memo(() => {
  return <AdminModulePage module="profiles" />;
});

CachedProfilesPage.displayName = "CachedProfilesPage";
