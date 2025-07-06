import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { inviteTeamMember, type InviteMemberData } from "@/lib/fetchers/team";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, UserPlus } from "lucide-react";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  teamId,
  teamName,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("请输入邮箱地址");
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("请输入有效的邮箱地址");
      return;
    }

    setIsLoading(true);

    try {
      const inviteData: InviteMemberData = { email };
      await inviteTeamMember(teamId, inviteData, session!.access_token);

      toast.success(`已成功邀请 ${email} 加入团队 ${teamName}`);

      // 刷新工作空间和团队列表以更新成员数量
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });

      // TODO: 发送邮件确认功能
      // 当前是直接邀请成功，后续需要实现邮件确认流程：
      // 1. 发送邀请邮件到用户邮箱
      // 2. 邮件包含确认链接和团队信息
      // 3. 用户点击邮件链接确认加入
      // 4. 确认后才真正将用户添加到团队
      // 5. 可能需要创建邀请记录表来跟踪邀请状态

      setEmail("");
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "邀请成员时发生错误，请重试";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            邀请新成员
          </DialogTitle>
          <DialogDescription>
            邀请新成员加入团队 &ldquo;{teamName}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="输入要邀请的用户邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              我们将向该邮箱发送邀请链接
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading || !email.trim()}>
              {isLoading ? "邀请中..." : "发送邀请"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
