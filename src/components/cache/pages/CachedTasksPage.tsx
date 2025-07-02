"use client";

import React from "react";
import TasksPage from "@/app/[locale]/(main)/tasks/page";

export const CachedTasksPage = React.memo(() => {
  return (
    <div className="h-full w-full">
      <TasksPage />
    </div>
  );
});

CachedTasksPage.displayName = "CachedTasksPage";
