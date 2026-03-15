"use client";

import React from "react";
import { AdminModulePage } from "@/components/admin/AdminModulePage";

export const CachedTeachersPage = React.memo(() => {
  return <AdminModulePage module="teachers" />;
});

CachedTeachersPage.displayName = "CachedTeachersPage";
