"use client";

import * as React from "react";
import { ArrowRight, Loader2, Plus, Users } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTeam } from "@/hooks/useTeam";
import { CreateTeamDialog } from "@/components/dialogs/CreateTeamDialog";
import { useRouter } from "@/i18n/navigation";
import { useWorkspaceStore } from "@/stores/workspace";
import type { Team } from "@/lib/fetchers/team";

const getInitials = (teamName: string) => {
  const normalized = teamName.trim();
  return normalized ? normalized.charAt(0).toUpperCase() : "T";
};

export default function TeamsSettingsPage() {
  const router = useRouter();
  const { setCurrentWorkspaceId } = useWorkspaceStore();
  const { teams = [], isLoadingTeams, teamsError } = useTeam();
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = React.useState(false);

  const handleTeamCreated = React.useCallback(
    async (team: Team) => {
      if (team.workspace?.id) {
        setCurrentWorkspaceId(team.workspace.id);
        localStorage.setItem("currentWorkspaceId", team.workspace.id);
      }

      router.push(`/settings/team/${team.id}`);
    },
    [router, setCurrentWorkspaceId],
  );

  return (
    <div className="space-y-6 p-4">
      <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_42%),linear-gradient(135deg,_rgba(17,24,39,0.98),_rgba(30,41,59,0.9))] text-white">
        <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Teams
            </CardTitle>
            <CardDescription className="max-w-2xl text-slate-200/80">
              这里展示你当前所属的全部团队。点击任意团队可进入它的设置页，owner/admin 可以继续编辑资料与成员权限。
            </CardDescription>
          </div>

          <Button
            type="button"
            className="bg-white text-slate-900 hover:bg-white/90"
            onClick={() => setIsCreateTeamDialogOpen(true)}
          >
            <Plus className="size-4" />
            Create new team
          </Button>
        </CardHeader>
      </Card>

      {isLoadingTeams ? (
        <Card className="border-none">
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            正在加载团队列表...
          </CardContent>
        </Card>
      ) : teamsError ? (
        <Card className="border-none">
          <CardHeader>
            <CardTitle>加载失败</CardTitle>
            <CardDescription>
              {(teamsError as Error).message || "暂时无法读取团队列表"}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : teams.length === 0 ? (
        <Card className="border-none">
          <CardContent className="flex flex-col items-start gap-4 py-10">
            <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-600">
              <Users className="size-6" />
            </div>
            <div className="space-y-1">
              <div className="text-lg font-semibold">你还没有团队</div>
              <div className="text-sm text-muted-foreground">
                从这里创建你的第一个团队，系统会自动生成对应的 team workspace。
              </div>
            </div>
            <Button type="button" onClick={() => setIsCreateTeamDialogOpen(true)}>
              <Plus className="size-4" />
              Create new team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="border-none transition-colors hover:bg-accent/40"
            >
              <CardContent className="flex h-full flex-col gap-5 p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="size-12 border border-border/70">
                    <AvatarImage src={team.avatarUrl ?? undefined} alt={team.name} />
                    <AvatarFallback>{getInitials(team.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold">
                      {team.name}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {team.members.length} 位成员
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-auto justify-between"
                  onClick={() => router.push(`/settings/team/${team.id}`)}
                >
                  打开团队设置
                  <ArrowRight className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamDialog
        open={isCreateTeamDialogOpen}
        onOpenChange={setIsCreateTeamDialogOpen}
        onCreated={handleTeamCreated}
      />
    </div>
  );
}
