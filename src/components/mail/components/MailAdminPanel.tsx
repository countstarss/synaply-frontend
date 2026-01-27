"use client";

import * as React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMailAccessStore } from "../store/use-mail-access-store";

const statusBadge: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  active: "default",
  disabled: "outline",
};

export function MailAdminPanel() {
  const {
    applications,
    accounts,
    approveApplication,
    rejectApplication,
    toggleAccountStatus,
  } = useMailAccessStore();

  const pendingApplications = applications.filter(
    (application) => application.status === "pending",
  );
  const reviewedApplications = applications.filter(
    (application) => application.status !== "pending",
  );

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold">邮箱管理面板</h2>
          <p className="text-sm text-muted-foreground mt-1">
            管理邮箱申请、审批记录与团队成员邮箱状态。
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="py-4">
            <CardHeader>
              <CardTitle>待审批</CardTitle>
              <CardDescription>需要处理的申请</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {pendingApplications.length}
              </div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardHeader>
              <CardTitle>邮箱账户</CardTitle>
              <CardDescription>团队成员邮箱数量</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{accounts.length}</div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardHeader>
              <CardTitle>禁用账号</CardTitle>
              <CardDescription>需要关注的账号</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">
                {
                  accounts.filter((account) => account.status === "disabled")
                    .length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="py-4">
          <CardHeader>
            <CardTitle>待审批列表</CardTitle>
            <CardDescription>审批或拒绝成员邮箱申请</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {pendingApplications.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                暂无待审批申请
              </div>
            ) : (
              pendingApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-col gap-3 rounded-md border p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{application.userName}</div>
                      <div className="text-sm text-muted-foreground">
                        {application.requestedPrefix}@synaply.com
                      </div>
                    </div>
                    <Badge variant={statusBadge[application.status]}>
                      待审批
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {application.reason || "未填写申请理由"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    提交时间：{format(new Date(application.createdAt), "PPpp")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveApplication(application.id)}
                    >
                      通过
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectApplication(application.id)}
                    >
                      拒绝
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader>
            <CardTitle>邮箱账户列表</CardTitle>
            <CardDescription>启用或禁用成员邮箱</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 mt-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between gap-4 rounded-md border p-3"
              >
                <div>
                  <div className="font-medium">{account.email}</div>
                  <div className="text-xs text-muted-foreground">
                    创建时间：{format(new Date(account.createdAt), "PPpp")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusBadge[account.status]}>
                    {account.status === "active" ? "启用" : "禁用"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAccountStatus(account.id)}
                  >
                    {account.status === "active" ? "禁用" : "启用"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader>
            <CardTitle>审批记录</CardTitle>
            <CardDescription>已处理的申请历史</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 my-2">
            {reviewedApplications.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无记录</div>
            ) : (
              reviewedApplications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-col gap-2 rounded-md border p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{application.userName}</div>
                    <Badge variant={statusBadge[application.status]}>
                      {application.status === "approved" ? "已通过" : "已拒绝"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {application.requestedPrefix}@synaply.com
                  </div>
                  {application.reviewedAt && (
                    <div className="text-xs text-muted-foreground">
                      审批时间：
                      {format(new Date(application.reviewedAt), "PPpp")}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-2">
            <Separator />
            <div className="text-sm text-muted-foreground">
              邮箱配额与域名配置将在后续版本接入。
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
