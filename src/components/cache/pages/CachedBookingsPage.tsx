"use client";

import React from "react";
import { AdminModulePage } from "@/components/admin/AdminModulePage";

export const CachedBookingsPage = React.memo(() => {
  return <AdminModulePage module="bookings" />;
});

CachedBookingsPage.displayName = "CachedBookingsPage";
