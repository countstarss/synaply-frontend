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
import { ADMIN_MODULES } from "@/lib/data/admin-data";
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
          <h1 className="text-2xl font-semibold">后台设置</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            这里只保留 Admin 初期开发最有用的默认项：默认落地模块、展示密度和总览行为。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">平台默认项</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">工作台名称</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>默认语言</Label>
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
                <Label>默认落地模块</Label>
                <Select
                  value={landingModule}
                  onValueChange={(value) =>
                    setLandingModule(value as typeof landingModule)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_MODULES.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.label}
                      </SelectItem>
                    ))}
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
                  <span>紧凑布局</span>
                </label>
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={emailDigest}
                    onCheckedChange={(checked) => setEmailDigest(checked === true)}
                  />
                  <span>每周摘要通知</span>
                </label>
              </div>

              <Button
                onClick={() =>
                  toast.success("默认项已保存到本地后台设置。")
                }
              >
                保存默认项
              </Button>
            </CardContent>
          </Card>

          <Card className="border-app-border bg-app-content-bg">
            <CardHeader>
              <CardTitle className="text-base">配置入口</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Link href="/settings/dashboard" className="block rounded-lg border border-app-border px-3 py-2 hover:bg-app-bg">
                总览指标配置与自定义指标
              </Link>
              <Link href="/settings/profile" className="block rounded-lg border border-app-border px-3 py-2 hover:bg-app-bg">
                个人偏好与资料字段
              </Link>
              <Link href="/settings/workspace" className="block rounded-lg border border-app-border px-3 py-2 hover:bg-app-bg">
                工作台策略与环境设置
              </Link>
              <Link href="/settings/members" className="block rounded-lg border border-app-border px-3 py-2 hover:bg-app-bg">
                成员角色与邀请模板
              </Link>
            </CardContent>
          </Card>
        </div>

        <DashboardPreferencesPanel />
      </div>
    </div>
  );
}
