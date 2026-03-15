"use client";

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

export default function WorkspaceSettingsPage() {
  const [workspaceName, setWorkspaceName] = useState("Acme Workspace");
  const [domain, setDomain] = useState("acme.dev");
  const [theme, setTheme] = useState("system");
  const [dateFormat, setDateFormat] = useState("yyyy-mm-dd");
  const [auditLog, setAuditLog] = useState(true);
  const [allowExports, setAllowExports] = useState(true);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="text-2xl font-semibold">Workspace</h1>

        <Card className="border-app-border bg-app-content-bg">
          <CardHeader>
            <CardTitle className="text-base">Environment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="workspace">Workspace Name</Label>
                <Input
                  id="workspace"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Theme Mode</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select value={dateFormat} onValueChange={setDateFormat}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={auditLog}
                  onCheckedChange={(checked) => setAuditLog(checked === true)}
                />
                <span>Enable audit log tracking</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={allowExports}
                  onCheckedChange={(checked) => setAllowExports(checked === true)}
                />
                <span>Allow data exports for managers</span>
              </label>
            </div>

            <Button onClick={() => toast.success("Workspace settings saved.")}>Save workspace settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
