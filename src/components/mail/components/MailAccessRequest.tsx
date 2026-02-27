"use client";

import * as React from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useMailAccessStore } from "../store/use-mail-access-store";

const statusBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  disabled: "outline",
  none: "outline",
};

export function MailAccessRequest() {
  const {
    currentUser,
    submitApplication,
    getCurrentUserApplication,
    getCurrentUserAccount,
  } = useMailAccessStore();
  const application = getCurrentUserApplication();
  const account = getCurrentUserAccount();
  const [prefix, setPrefix] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState("");

  const mailboxStatus =
    account?.status === "disabled"
      ? "disabled"
      : application?.status ?? "none";

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!prefix.trim()) {
      setError("请输入邮箱前缀");
      return;
    }
    submitApplication(prefix.trim(), reason.trim());
    setPrefix("");
    setReason("");
    setError("");
  };

  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>申请团队邮箱</CardTitle>
          <CardDescription>
            当前账号 {currentUser.name} 暂无团队邮箱，请提交申请。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">申请状态</span>
            <Badge variant={statusBadge[mailboxStatus]}>
              {mailboxStatus === "pending"
                ? "待审批"
                : mailboxStatus === "approved"
                ? "已通过"
                : mailboxStatus === "rejected"
                ? "已拒绝"
                : mailboxStatus === "disabled"
                ? "邮箱已禁用"
                : "未申请"}
            </Badge>
          </div>

          {mailboxStatus === "disabled" && (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              你的团队邮箱已被禁用，请联系管理员恢复权限。
            </div>
          )}

          {application && (
            <div className="rounded-md border bg-muted/30 p-4 text-sm">
              <div className="font-medium">
                申请邮箱：{application.requestedPrefix}@synaply.com
              </div>
              <div className="text-muted-foreground mt-1">
                申请理由：{application.reason || "未填写"}
              </div>
              <div className="text-muted-foreground mt-1">
                提交时间：{format(new Date(application.createdAt), "PPpp")}
              </div>
              {application.reviewedAt && (
                <div className="text-muted-foreground mt-1">
                  审批时间：{format(new Date(application.reviewedAt), "PPpp")}
                </div>
              )}
            </div>
          )}

          {(mailboxStatus === "none" || mailboxStatus === "rejected") && (
            <>
              <Separator />
              <form className="grid gap-3" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">邮箱前缀</label>
                  <Input
                    placeholder="例如 luke.chen"
                    value={prefix}
                    onChange={(event) => {
                      setPrefix(event.target.value);
                      setError("");
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">申请理由</label>
                  <Textarea
                    placeholder="说明用途或角色"
                    value={reason}
                    onChange={(event) => {
                      setReason(event.target.value);
                      setError("");
                    }}
                  />
                </div>
                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}
                <CardFooter className="justify-end px-0">
                  <Button type="submit">提交申请</Button>
                </CardFooter>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
