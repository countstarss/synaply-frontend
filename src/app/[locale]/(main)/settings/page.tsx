"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DashboardPreferencesPanel } from "@/components/settings/DashboardPreferencesPanel";
import { useDashboardPreferencesStore } from "@/stores/dashboard-preferences";

export default function SettingsPage() {
  const { landingModule, setLandingModule, compactDensity, setCompactDensity } =
    useDashboardPreferencesStore();

  const [workspaceName, setWorkspaceName] = useState("Acme Workspace");
  const [locale, setLocale] = useState("en");
  const [emailDigest, setEmailDigest] = useState(true);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure admin behavior and default experiences for your future
            business modules.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">Platform Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Default Locale</Label>
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Landing Module</Label>
                <Select
                  value={landingModule}
                  onValueChange={(value) =>
                    setLandingModule(
                      value as
                        | "dashboard"
                        | "customers"
                        | "orders"
                        | "analytics"
                        | "content",
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="orders">Orders</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={compactDensity}
                    onCheckedChange={(checked) =>
                      setCompactDensity(checked === true)
                    }
                  />
                  <span>Compact UI density</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={emailDigest}
                    onCheckedChange={(checked) => setEmailDigest(checked === true)}
                  />
                  <span>Weekly digest notifications</span>
                </label>
              </div>

              <Button
                onClick={() =>
                  toast.success("Defaults saved to local template settings.")
                }
              >
                Save defaults
              </Button>
            </CardContent>
          </Card>

          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">Configuration Modules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Link href="/settings/dashboard" className="block rounded-lg border border-app-border px-3 py-2 hover:bg-app-bg">
                Dashboard preferences and metric composer
              </Link>
              <Link href="/settings/profile" className="block rounded-lg border border-app-border px-3 py-2 hover:bg-app-bg">
                Profile fields and personal defaults
              </Link>
              <Link href="/settings/workspace" className="block rounded-lg border border-app-border px-3 py-2 hover:bg-app-bg">
                Workspace policies and environment settings
              </Link>
              <Link href="/settings/members" className="block rounded-lg border border-app-border px-3 py-2 hover:bg-app-bg">
                Member roles and invite templates
              </Link>
            </CardContent>
          </Card>
        </div>

        <DashboardPreferencesPanel />
      </div>
    </div>
  );
}
