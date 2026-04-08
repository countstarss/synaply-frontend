"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Save, Trash2, Upload } from "lucide-react";
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
import {
  fetchCurrentUser,
  getUserNameFallback,
  updateCurrentUser,
  type UserInfo,
} from "@/lib/fetchers/user";
import {
  createClientComponentClient,
  SUPABASE_AVATAR_BUCKET,
} from "@/lib/supabase";

const CURRENT_USER_QUERY_KEY = ["current-user-profile"] as const;
const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const getInitials = (profile?: Pick<UserInfo, "name" | "email"> | null) => {
  const nameSource = profile?.name?.trim();
  const emailSource = profile?.email ? getUserNameFallback(profile.email) : "U";
  const firstCharacter = (nameSource || emailSource).charAt(0);
  return firstCharacter ? firstCharacter.toUpperCase() : "U";
};

const resolveProfileErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return "更新资料失败";
  }

  if (error.message.includes("Bucket not found")) {
    return "头像存储桶不存在，请先执行 Supabase migration，或在 Storage 中创建 avatars bucket。";
  }

  return error.message;
};

export default function ProfileSettingsPage() {
  const { session, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const supabase = React.useMemo(() => createClientComponentClient(), []);
  const initializedUserIdRef = React.useRef<string | null>(null);

  const [displayName, setDisplayName] = React.useState("");
  const [savedDisplayName, setSavedDisplayName] = React.useState("");
  const [storedAvatarUrl, setStoredAvatarUrl] = React.useState<string | null>(
    null,
  );
  const [selectedAvatarFile, setSelectedAvatarFile] =
    React.useState<File | null>(null);
  const [avatarMarkedForRemoval, setAvatarMarkedForRemoval] =
    React.useState(false);

  const profileQuery = useQuery({
    queryKey: [...CURRENT_USER_QUERY_KEY, session?.user?.id],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error("登录状态已过期，请重新登录后再试");
      }

      return fetchCurrentUser(session.access_token);
    },
    enabled: !!session?.access_token,
    staleTime: 60 * 1000,
  });

  React.useEffect(() => {
    const profile = profileQuery.data;

    if (!profile?.id || initializedUserIdRef.current === profile.id) {
      return;
    }

    initializedUserIdRef.current = profile.id;
    setDisplayName(profile.name ?? "");
    setSavedDisplayName(profile.name ?? "");
    setStoredAvatarUrl(profile.avatarUrl ?? null);
    setSelectedAvatarFile(null);
    setAvatarMarkedForRemoval(false);
  }, [profileQuery.data]);

  const handleAvatarSelection = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
        toast.error("头像仅支持 JPG、PNG 或 WebP 格式");
        return;
      }

      if (file.size > MAX_AVATAR_SIZE_BYTES) {
        toast.error("头像大小不能超过 3MB");
        return;
      }

      setAvatarMarkedForRemoval(false);
      setSelectedAvatarFile(file);
      toast.success(`已选择 ${file.name}，点击“保存更改”后开始上传`);
    },
    [],
  );

  const handleRemoveAvatar = React.useCallback(() => {
    if (selectedAvatarFile) {
      setSelectedAvatarFile(null);
      setAvatarMarkedForRemoval(false);
      toast.success("已取消新头像选择");
      return;
    }

    if (!storedAvatarUrl) {
      return;
    }

    setAvatarMarkedForRemoval(true);
    toast.success("已标记移除头像，点击“保存更改”后生效");
  }, [selectedAvatarFile, storedAvatarUrl]);

  const currentProfile = profileQuery.data;
  const normalizedDisplayName = displayName.trim();
  const hasAvatarChange = avatarMarkedForRemoval || !!selectedAvatarFile;
  const isDirty =
    normalizedDisplayName !== savedDisplayName.trim() || hasAvatarChange;
  const resolvedAvatarUrl = storedAvatarUrl ?? null;

  const updateProfileMutation = useMutation({
    onMutate: () => {
      const toastId = toast.loading(
        selectedAvatarFile
          ? "正在上传头像并保存资料..."
          : avatarMarkedForRemoval
            ? "正在移除头像并保存资料..."
            : "正在保存资料...",
      );

      return { toastId };
    },
    mutationFn: async () => {
      if (!session?.access_token || !session.user?.id) {
        throw new Error("登录状态已失效，请重新登录");
      }

      const normalizedName = normalizedDisplayName || null;
      const avatarStoragePath = `${session.user.id}/avatar`;
      let nextAvatarUrl = avatarMarkedForRemoval ? null : storedAvatarUrl;

      if (avatarMarkedForRemoval) {
        const { error } = await supabase.storage
          .from(SUPABASE_AVATAR_BUCKET)
          .remove([avatarStoragePath]);

        if (error) {
          console.warn("删除旧头像失败:", error);
        }
      }

      if (selectedAvatarFile) {
        const { error: uploadError } = await supabase.storage
          .from(SUPABASE_AVATAR_BUCKET)
          .upload(avatarStoragePath, selectedAvatarFile, {
            contentType: selectedAvatarFile.type,
            upsert: true,
          });

        if (uploadError) {
          throw new Error(uploadError.message || "头像上传失败");
        }

        const { data: publicUrlData } = supabase.storage
          .from(SUPABASE_AVATAR_BUCKET)
          .getPublicUrl(avatarStoragePath);

        nextAvatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;
      }

      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: normalizedName,
          name: normalizedName,
          avatar_url: nextAvatarUrl,
        },
      });

      if (authUpdateError) {
        throw new Error(authUpdateError.message || "同步登录资料失败");
      }

      return updateCurrentUser(session.access_token, {
        name: normalizedName,
        avatarUrl: nextAvatarUrl,
      });
    },
    onSuccess: (updatedProfile, _variables, context) => {
      queryClient.setQueryData(
        [...CURRENT_USER_QUERY_KEY, session?.user?.id],
        updatedProfile,
      );
      queryClient.invalidateQueries({
        queryKey: ["user", session?.user?.id],
      });

      setDisplayName(updatedProfile.name ?? "");
      setSavedDisplayName(updatedProfile.name ?? "");
      setStoredAvatarUrl(updatedProfile.avatarUrl ?? null);
      setSelectedAvatarFile(null);
      setAvatarMarkedForRemoval(false);
      toast.success("个人资料已更新", { id: context?.toastId });
    },
    onError: (error, _variables, context) => {
      toast.error(resolveProfileErrorMessage(error), { id: context?.toastId });
    },
  });

  const isAvatarOperationPending =
    updateProfileMutation.isPending && hasAvatarChange;
  const avatarStatusMessage = selectedAvatarFile
    ? `已选择 ${selectedAvatarFile.name}，保存后开始上传。`
    : avatarMarkedForRemoval
      ? "已标记移除头像，保存后生效。"
      : "支持 JPG、PNG、WebP，大小不超过 3MB。新头像会在上传成功后显示。";

  if (!session && !authLoading) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>需要先登录</CardTitle>
            <CardDescription>
              登录后才能上传头像并修改你的个人资料。
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (authLoading || profileQuery.isLoading) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            正在加载个人资料...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileQuery.error) {
    return (
      <div className="p-0">
        <Card className="border-none">
          <CardHeader>
            <CardTitle>加载失败</CardTitle>
            <CardDescription>
              {(profileQuery.error as Error).message || "暂时无法读取个人资料"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_42%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.88))] text-slate-50">
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            个人资料
          </CardTitle>
          <CardDescription className="max-w-2xl text-slate-300">
            这里管理会在 Synaply 内展示的基础账号信息。头像会上传到
            Supabase Storage，并同步到当前登录账户的资料元数据里。
          </CardDescription>
        </CardHeader>
      </Card>

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();

          if (!isDirty || updateProfileMutation.isPending) {
            return;
          }

          updateProfileMutation.mutate();
        }}
      >
        <Card className="border-none">
          <CardHeader>
            <CardTitle>头像</CardTitle>
            <CardDescription>
              上传一张清晰的头像，团队成员会在评论、聊天和协作视图里看到它。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[auto,1fr] md:items-center pb-6">
            <div className="relative">
              <Avatar className="size-24 border border-border/70 shadow-sm">
                <AvatarImage src={resolvedAvatarUrl ?? undefined} alt="个人头像" />
                <AvatarFallback className="text-lg font-semibold">
                  {getInitials(currentProfile)}
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
                  建议使用正方形图片
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
                  disabled={updateProfileMutation.isPending}
                >
                  <Upload className="size-4" />
                  上传头像
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleRemoveAvatar}
                  disabled={
                    updateProfileMutation.isPending ||
                    (!storedAvatarUrl && !selectedAvatarFile)
                  }
                >
                  <Trash2 className="size-4" />
                  {selectedAvatarFile ? "取消选择" : "移除头像"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none">
          <CardHeader>
            <CardTitle>基础信息</CardTitle>
            <CardDescription>
              目前可修改展示名称，邮箱作为登录标识暂时保持只读。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="display-name">显示名称</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={80}
                placeholder="给自己起个在团队里更容易识别的名字"
                disabled={updateProfileMutation.isPending}
              />
            </div>

            <Separator />

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">登录邮箱</Label>
                <Input
                  id="email"
                  value={currentProfile?.email ?? session?.user?.email ?? ""}
                  readOnly
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="created-at">注册时间</Label>
                <Input
                  id="created-at"
                  value={
                    currentProfile?.createdAt
                      ? format(
                          new Date(currentProfile.createdAt),
                          "yyyy-MM-dd HH:mm",
                        )
                      : "-"
                  }
                  readOnly
                  disabled
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between p-6">
            <div className="text-sm text-muted-foreground">
              {isDirty
                ? "你有尚未保存的更改。"
                : "资料已是最新状态。"}
            </div>

            <Button
              type="submit"
              disabled={!isDirty || updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
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
