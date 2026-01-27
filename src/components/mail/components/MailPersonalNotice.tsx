"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function MailPersonalNotice() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Card className="max-w-lg p-6">
        <CardHeader>
          <CardTitle>个人账户暂不支持邮箱</CardTitle>
          <CardDescription>
            邮箱功能仅对团队工作区开放，请切换到团队空间后再使用。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          如果你需要团队邮箱，请联系管理员创建或加入团队。
        </CardContent>
      </Card>
    </div>
  );
}
