"use client";

import React from "react";
import { AdminDashboardPage } from "@/components/admin/AdminDashboardPage";

export const CachedDashboardPage = React.memo(() => {
  return <AdminDashboardPage />;
});

CachedDashboardPage.displayName = "CachedDashboardPage";
