"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useTeamMembers } from "@/hooks/useTeam";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  removeTeamMember,
  updateTeamMemberRole,
  type TeamMember,
} from "@/lib/fetchers/team";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

const ROLE_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  ADMIN: "secondary",
  MEMBER: "outline",
};

const resolveMemberUserId = (member: TeamMember) =>
  member.user?.id ?? member.userId;

export default function MembersSettingsSection() {
  const { session } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const teamId = currentWorkspace?.teamId;
  const queryClient = useQueryClient();
  const { data: members, isLoading, error } = useTeamMembers(teamId);
  const [pendingRemoveMember, setPendingRemoveMember] =
    React.useState<TeamMember | null>(null);

  const currentMember = members?.find((member) => {
    const memberUserId = resolveMemberUserId(member);
    return memberUserId === session?.user?.id;
  });
  const isOwner = currentMember?.role === "OWNER";

  const updateRoleMutation = useMutation({
    mutationFn: (payload: {
      memberUserId: string;
      role: "OWNER" | "ADMIN" | "MEMBER";
    }) =>
      updateTeamMemberRole(
        teamId || "",
        payload.memberUserId,
        payload.role,
        session?.access_token || "",
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberUserId: string) =>
      removeTeamMember(teamId || "", memberUserId, session?.access_token || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
    },
  });

  const handleConfirmRemoveMember = () => {
    if (!pendingRemoveMember) return;
    const memberUserId = resolveMemberUserId(pendingRemoveMember);
    if (!memberUserId) return;
    removeMemberMutation.mutate(memberUserId);
    setPendingRemoveMember(null);
  };

  if (!teamId) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>团队成员管理</CardTitle>
            <CardDescription>该功能仅在团队工作区可用。</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            请切换到团队工作区后管理成员权限。
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 py-1">
      {!isOwner && (
        <Card className="border-none">
          <CardHeader>
            <CardTitle>权限不足</CardTitle>
            <CardDescription>只有 OWNER 可以管理团队成员。</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            如需调整成员角色，请联系团队拥有者。
          </CardContent>
        </Card>
      )}

      <Card className="border-none">
        <CardHeader>
          <CardTitle>成员列表</CardTitle>
          <CardDescription>
            管理团队成员角色与权限, 仅 OWNER 可更新角色或移除成员。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 pb-6">
          {isLoading && (
            <div className="text-sm text-muted-foreground">加载中...</div>
          )}
          {error && (
            <div className="text-sm text-destructive">
              {(error as Error).message || "加载成员失败"}
            </div>
          )}
          {members?.map((member) => {
            const memberUserId = resolveMemberUserId(member);
            const isSelf = memberUserId === session?.user?.id;
            return (
              <div
                key={member.id}
                className="flex flex-col gap-3 rounded-md border p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {member.user?.name || member.user?.email || "未知成员"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {member.user?.email}
                    </div>
                  </div>
                  <Badge variant={ROLE_BADGE[member.role]}>
                    {ROLE_LABELS[member.role]}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  加入时间：{format(new Date(member.createdAt), "PPpp")}
                </div>
                <Separator />
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      memberUserId &&
                      updateRoleMutation.mutate({
                        memberUserId,
                        role: value as "OWNER" | "ADMIN" | "MEMBER",
                      })
                    }
                    disabled={
                      !isOwner ||
                      isSelf ||
                      updateRoleMutation.isPending ||
                      !memberUserId
                    }
                  >
                    <SelectTrigger size="sm" className="w-[160px]">
                      <SelectValue placeholder="选择角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNER">Owner</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      !isOwner ||
                      isSelf ||
                      removeMemberMutation.isPending ||
                      !memberUserId
                    }
                    onClick={() => setPendingRemoveMember(member)}
                  >
                    移除成员
                  </Button>
                  {isSelf && (
                    <span className="text-xs text-muted-foreground">
                      当前账号不能修改自身角色或移除。
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2">
          {(updateRoleMutation.error || removeMemberMutation.error) && (
            <div className="text-sm text-destructive">
              {(updateRoleMutation.error as Error)?.message ||
                (removeMemberMutation.error as Error)?.message ||
                "操作失败"}
            </div>
          )}
        </CardFooter>
      </Card>
      </div>

      <Dialog
        open={Boolean(pendingRemoveMember)}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveMember(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>移除团队成员？</DialogTitle>
            <DialogDescription>
              将把「
              {pendingRemoveMember?.user?.email ||
                pendingRemoveMember?.user?.name ||
                "该成员"}
              」从当前团队移除。对方将不再看到这个团队工作区中的项目、任务和文档。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRemoveMember(null)}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmRemoveMember}
            >
              确认移除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
