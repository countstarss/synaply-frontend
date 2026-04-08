"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Save, Shield, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useTeamById, useUpdateTeam } from "@/hooks/useTeam";
import {
  createClientComponentClient,
  SUPABASE_AVATAR_BUCKET,
} from "@/lib/supabase";
import type { Team } from "@/lib/fetchers/team";

const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const getInitials = (team?: Pick<Team, "name"> | null) => {
  const source = team?.name?.trim() || "T";
  return source.charAt(0).toUpperCase();
};

interface UploadedTeamAvatarState {
  fileName: string;
  path: string;
  url: string;
}

const createTeamAvatarPath = (
  userId: string,
  teamId: string,
  fileName: string,
) => {
  const normalizedFileName = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const safeFileName = normalizedFileName || "avatar";
  const uniqueId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}`;

  return `${userId}/teams/${teamId}/${uniqueId}-${safeFileName}`;
};

const getStoragePathFromUrl = (avatarUrl: string | null) => {
  if (!avatarUrl) {
    return null;
  }

  const cleanUrl = avatarUrl.split("?")[0];
  const bucketMarker = `/storage/v1/object/public/${SUPABASE_AVATAR_BUCKET}/`;
  const markerIndex = cleanUrl.indexOf(bucketMarker);

  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(cleanUrl.slice(markerIndex + bucketMarker.length));
};

const resolveTeamErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return "更新团队资料失败";
  }

  if (error.message.includes("Bucket not found")) {
    return "头像存储桶不存在，请先在 Supabase Storage 中创建 avatars bucket。";
  }

  if (error.message.includes("row-level security policy")) {
    return "团队头像上传被 Storage 权限策略拦截了。我已经把上传路径改成兼容当前策略的格式，刷新页面后再试一次。";
  }

  return error.message;
};

export default function TeamSettingsPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = Array.isArray(params.teamId) ? params.teamId[0] : params.teamId;
  const { session, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const supabase = React.useMemo(() => createClientComponentClient(), []);
  const initializedTeamIdRef = React.useRef<string | null>(null);

  const [teamName, setTeamName] = React.useState("");
  const [savedTeamName, setSavedTeamName] = React.useState("");
  const [storedAvatarUrl, setStoredAvatarUrl] = React.useState<string | null>(
    null,
  );
  const [pendingUploadedAvatar, setPendingUploadedAvatar] =
    React.useState<UploadedTeamAvatarState | null>(null);
  const [avatarMarkedForRemoval, setAvatarMarkedForRemoval] =
    React.useState(false);

  const teamQuery = useTeamById(teamId);
  const updateTeamMutation = useUpdateTeam(teamId);

  React.useEffect(() => {
    const team = teamQuery.data;

    if (!team?.id || initializedTeamIdRef.current === team.id) {
      return;
    }

    initializedTeamIdRef.current = team.id;
    setTeamName(team.name);
    setSavedTeamName(team.name);
    setStoredAvatarUrl(team.avatarUrl ?? null);
    setPendingUploadedAvatar(null);
    setAvatarMarkedForRemoval(false);
  }, [teamQuery.data]);

  const uploadAvatarMutation = useMutation({
    onMutate: (file: File) => {
      const toastId = toast.loading(`正在上传 ${file.name}...`);
      return { toastId };
    },
    mutationFn: async (file: File) => {
      if (!session?.user?.id || !teamId) {
        throw new Error("登录状态已失效，请重新登录");
      }

      if (pendingUploadedAvatar?.path) {
        const { error: cleanupError } = await supabase.storage
          .from(SUPABASE_AVATAR_BUCKET)
          .remove([pendingUploadedAvatar.path]);

        if (cleanupError) {
          console.warn("清理未保存团队头像失败:", cleanupError);
        }
      }

      const nextPath = createTeamAvatarPath(session.user.id, teamId, file.name);
      const { error: uploadError } = await supabase.storage
        .from(SUPABASE_AVATAR_BUCKET)
        .upload(nextPath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || "团队头像上传失败");
      }

      const { data: publicUrlData } = supabase.storage
        .from(SUPABASE_AVATAR_BUCKET)
        .getPublicUrl(nextPath);

      return {
        fileName: file.name,
        path: nextPath,
        url: `${publicUrlData.publicUrl}?v=${Date.now()}`,
      } satisfies UploadedTeamAvatarState;
    },
    onSuccess: (uploadedAvatar, _file, context) => {
      setPendingUploadedAvatar(uploadedAvatar);
      setAvatarMarkedForRemoval(false);
      toast.success("团队头像上传成功，点击“保存更改”后生效", {
        id: context?.toastId,
      });
    },
    onError: (error, _file, context) => {
      toast.error(resolveTeamErrorMessage(error), { id: context?.toastId });
    },
  });

  const handleAvatarSelection = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
        toast.error("团队头像仅支持 JPG、PNG 或 WebP 格式");
        return;
      }

      if (file.size > MAX_AVATAR_SIZE_BYTES) {
        toast.error("团队头像大小不能超过 3MB");
        return;
      }

      uploadAvatarMutation.mutate(file);
    },
    [uploadAvatarMutation],
  );

  const handleRemoveAvatar = React.useCallback(() => {
    if (uploadAvatarMutation.isPending || updateTeamMutation.isPending) {
      return;
    }

    if (pendingUploadedAvatar) {
      void supabase.storage
        .from(SUPABASE_AVATAR_BUCKET)
        .remove([pendingUploadedAvatar.path])
        .then(({ error }) => {
          if (error) {
            console.warn("清理未保存团队头像失败:", error);
          }
        });

      setPendingUploadedAvatar(null);
      setAvatarMarkedForRemoval(false);
      toast.success("已取消新头像");
      return;
    }

    if (avatarMarkedForRemoval) {
      setAvatarMarkedForRemoval(false);
      toast.success("已撤销移除头像");
      return;
    }

    if (!storedAvatarUrl) {
      return;
    }

    setAvatarMarkedForRemoval(true);
    toast.success("已标记移除头像，点击“保存更改”后生效");
  }, [
    avatarMarkedForRemoval,
    pendingUploadedAvatar,
    storedAvatarUrl,
    supabase.storage,
    updateTeamMutation.isPending,
    uploadAvatarMutation.isPending,
  ]);

  const currentTeam = teamQuery.data;
  const currentMember = currentTeam?.members.find(
    (member) => member.user.id === session?.user?.id,
  );
  const canManageTeam =
    currentMember?.role === "OWNER" || currentMember?.role === "ADMIN";
  const normalizedTeamName = teamName.trim();
  const teamPageTitle = normalizedTeamName || currentTeam?.name || "未命名团队";
  const hasAvatarChange = avatarMarkedForRemoval || !!pendingUploadedAvatar;
  const isDirty =
    normalizedTeamName !== savedTeamName.trim() || hasAvatarChange;
  const resolvedAvatarUrl = avatarMarkedForRemoval
    ? null
    : pendingUploadedAvatar?.url ?? storedAvatarUrl ?? null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canManageTeam) {
      toast.error("只有 team owner 或 admin 可以修改团队资料");
      return;
    }

    if (!normalizedTeamName) {
      toast.error("请输入团队名称");
      return;
    }

    if (!session?.access_token || !teamId) {
      toast.error("登录状态已失效，请重新登录");
      return;
    }

    if (uploadAvatarMutation.isPending) {
      toast.error("头像仍在上传中，请稍候再保存");
      return;
    }

    const toastId = toast.loading(
      avatarMarkedForRemoval
        ? "正在移除团队头像并保存资料..."
        : "正在保存团队资料...",
    );

    try {
      const nextAvatarUrl = avatarMarkedForRemoval
        ? null
        : pendingUploadedAvatar?.url ?? storedAvatarUrl;

      const updatedTeam = await updateTeamMutation.mutateAsync({
        name: normalizedTeamName,
        avatarUrl: nextAvatarUrl,
      });

      const previousStoredAvatarPath = getStoragePathFromUrl(storedAvatarUrl);
      const nextAvatarPath = pendingUploadedAvatar?.path ?? null;

      queryClient.setQueryData(["team", teamId], updatedTeam);
      setTeamName(updatedTeam.name);
      setSavedTeamName(updatedTeam.name);
      setStoredAvatarUrl(updatedTeam.avatarUrl ?? null);
      setPendingUploadedAvatar(null);
      setAvatarMarkedForRemoval(false);

      if (
        previousStoredAvatarPath &&
        ((avatarMarkedForRemoval && previousStoredAvatarPath) ||
          (nextAvatarPath && previousStoredAvatarPath !== nextAvatarPath))
      ) {
        void supabase.storage
          .from(SUPABASE_AVATAR_BUCKET)
          .remove([previousStoredAvatarPath])
          .then(({ error }) => {
            if (error) {
              console.warn("清理旧团队头像失败:", error);
            }
          });
      }

      toast.success("团队资料已更新", { id: toastId });
    } catch (error) {
      toast.error(resolveTeamErrorMessage(error), { id: toastId });
    }
  };

  if (!teamId) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>团队不存在</CardTitle>
            <CardDescription>缺少 teamId，无法加载团队资料。</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!session && !authLoading) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>需要先登录</CardTitle>
            <CardDescription>
              登录后才能查看并管理团队资料。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (authLoading || teamQuery.isLoading) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            正在加载团队资料...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (teamQuery.error || !currentTeam) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>加载失败</CardTitle>
            <CardDescription>
              {(teamQuery.error as Error)?.message || "暂时无法读取团队资料"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isAvatarOperationPending =
    uploadAvatarMutation.isPending || (updateTeamMutation.isPending && hasAvatarChange);
  const avatarStatusMessage = uploadAvatarMutation.isPending
    ? "团队头像上传中，请稍候..."
    : pendingUploadedAvatar
      ? `团队头像 ${pendingUploadedAvatar.fileName} 已上传，点击“保存更改”后生效。`
    : avatarMarkedForRemoval
      ? "已标记移除头像，保存后生效。"
      : "选择图片后会立即上传；上传成功后，再点击“保存更改”应用到团队资料。";

  return (
    <div className="space-y-6 p-4">
      <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_42%),linear-gradient(135deg,_rgba(10,37,64,0.96),_rgba(15,118,110,0.88))] text-white">
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {teamPageTitle}
          </CardTitle>
          <CardDescription className="max-w-2xl text-emerald-50/80">
            当前团队的资料与身份信息会显示在这里。只有 team owner 和 admin 可以修改团队名称和头像。
          </CardDescription>
        </CardHeader>
      </Card>

      {!canManageTeam && (
        <Card className="border-none">
          <CardContent className="flex items-start gap-3 py-5 text-sm text-muted-foreground">
            <Shield className="mt-0.5 size-4 shrink-0" />
            <div>
              你当前是 <span className="font-medium text-foreground">{currentMember?.role ?? "MEMBER"}</span>
              ，可以查看团队资料，但只有 owner/admin 才能保存更改。
            </div>
          </CardContent>
        </Card>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="border-none">
          <CardHeader>
            <CardTitle>团队头像</CardTitle>
            <CardDescription>
              团队头像会用于工作空间切换、设置页和团队相关的协作视图展示。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 pb-6 md:grid-cols-[auto,1fr] md:items-center">
            <div className="relative">
              <Avatar className="size-24 border border-border/70 shadow-sm">
                <AvatarImage src={resolvedAvatarUrl ?? undefined} alt={currentTeam.name} />
                <AvatarFallback className="text-lg font-semibold">
                  {getInitials(currentTeam)}
                </AvatarFallback>
              </Avatar>
              {isAvatarOperationPending && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">
                  建议使用清晰的品牌或团队标识
                </div>
                <div className="text-sm text-muted-foreground">
                  {avatarStatusMessage}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarSelection}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    uploadAvatarMutation.isPending ||
                    updateTeamMutation.isPending ||
                    !canManageTeam
                  }
                >
                  {uploadAvatarMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {uploadAvatarMutation.isPending ? "上传中..." : "上传头像"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveAvatar}
                  disabled={
                    uploadAvatarMutation.isPending ||
                    updateTeamMutation.isPending ||
                    !canManageTeam ||
                    (!storedAvatarUrl &&
                      !pendingUploadedAvatar &&
                      !avatarMarkedForRemoval)
                  }
                >
                  <Trash2 className="size-4" />
                  {pendingUploadedAvatar
                    ? "取消新头像"
                    : avatarMarkedForRemoval
                      ? "撤销移除"
                      : "移除头像"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none">
          <CardHeader>
            <CardTitle>基础信息</CardTitle>
            <CardDescription>
              团队名称可以随时调整，创建时间和成员数量用于只读展示。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="team-name">团队名称</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                maxLength={100}
                placeholder="输入团队名称"
                disabled={updateTeamMutation.isPending || !canManageTeam}
              />
            </div>

            <Separator />

            <div className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="team-created-at">创建时间</Label>
                <Input
                  id="team-created-at"
                  value={format(new Date(currentTeam.createdAt), "yyyy-MM-dd HH:mm")}
                  readOnly
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-members-count">成员数量</Label>
                <Input
                  id="team-members-count"
                  value={`${currentTeam.members.length}`}
                  readOnly
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-role">你的角色</Label>
                <Input
                  id="team-role"
                  value={currentMember?.role || "MEMBER"}
                  readOnly
                  disabled
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3 p-6 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-muted-foreground">
              {!canManageTeam
                ? "当前账号只有查看权限。"
                : isDirty
                  ? "你有尚未保存的团队资料更改。"
                  : "团队资料已是最新状态。"}
            </div>

            <Button
              type="submit"
              disabled={
                !canManageTeam ||
                !isDirty ||
                uploadAvatarMutation.isPending ||
                updateTeamMutation.isPending
              }
            >
              {updateTeamMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              保存更改
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
