"use client";

import { DashboardPreferencesPanel } from "@/components/settings/DashboardPreferencesPanel";

export default function DashboardSettingsPage() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard Preferences</h1>
        <p className="text-sm text-muted-foreground">
          Control which widgets appear on the homepage and define your own custom
          metrics with formulas.
        </p>
        <DashboardPreferencesPanel />
      </div>
    </div>
  );
}
