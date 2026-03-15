"use client";

import React from "react";
import DashboardWorkbench from "@/components/template/DashboardWorkbench";

export const CachedDashboardPage = React.memo(() => {
  return <DashboardWorkbench />;
});

CachedDashboardPage.displayName = "CachedDashboardPage";
