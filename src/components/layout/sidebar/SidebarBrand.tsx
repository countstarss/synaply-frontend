"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Users,
  Plus,
  Settings,
  LogOut,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useRouter } from "@/i18n/navigation";
import { InviteMemberDialog } from "@/components/dialogs/InviteMemberDialog";

interface SidebarBrandProps {
  className?: string;
}

const SidebarBrand = ({ className }: SidebarBrandProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const {
    workspaces,
    currentWorkspace,
    loading,
    error,
    refetch,
    switchWorkspace,
  } = useWorkspace();
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const fallbackWorkspaceName =
    user?.user_metadata.name || user?.email?.split("@")[0] || "My workspace";
  const displayWorkspace = currentWorkspace ?? {
    id: "fallback-workspace",
    name: fallbackWorkspaceName,
    type: "PERSONAL" as const,
    memberCount: 1,
    isActive: true,
    avatarUrl: user?.user_metadata.avatar_url,
  };
  const workspaceLoadFailed = !loading && !currentWorkspace;

  const handleLogout = async () => {
    await signOut();
  };

  const handleInviteMember = () => {
    setShowInviteDialog(true);
  };

  const handleCreateWorkspace = () => {
    // TODO: 打开创建工作空间对话框
    console.log("创建新工作空间");
  };

  const handleSettings = () => {
    router.push("/settings/general");
  };

  // 包装switchWorkspace函数，添加日志记录并刷新页面
  const handleSwitchWorkspace = (workspaceId: string) => {
    const targetWorkspace = workspaces.find((w) => w.id === workspaceId);
    const currentType = currentWorkspace?.type;
    const targetType = targetWorkspace?.type;
    // 执行切换
    switchWorkspace(workspaceId);

    // 如果工作区类型发生变化，直接刷新浏览器
    if (currentType !== targetType) {
      setTimeout(() => {
        window.location.reload();
      }, 200);
    }
  };

  // 加载状态
  if (loading) {
    return (
      <div className={cn("flex items-center gap-3 p-4", className)}>
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1 flex items-center gap-4 pr-1">
          <div className="h-8 bg-gray-200 rounded animate-pulse flex-1 " />
          <ChevronDown className="h-4 w-4 text-muted-foreground animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="w-full px-2 pt-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between px-4 py-2 h-auto hover:bg-app-button-hover",
              className
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={displayWorkspace.avatarUrl} />
                <AvatarFallback className="bg-white text-black font-bold text-sm">
                  {displayWorkspace.type === "PERSONAL"
                    ? user?.user_metadata.name?.slice(0, 1) ||
                      user?.email?.slice(0, 1).toUpperCase()
                    : displayWorkspace.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start select-none">
                <span className="font-semibold text-lg truncate">
                  {displayWorkspace.type === "PERSONAL"
                    ? user?.user_metadata.name || user?.email?.split("@")[0]
                    : displayWorkspace.name.split(" ")[0]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {workspaceLoadFailed
                    ? "工作空间加载失败"
                    : displayWorkspace.type === "PERSONAL"
                      ? "个人空间"
                      : "团队空间"}
                </span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-72 p-2 bg-app-content-bg"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        {/* 当前工作空间信息 */}

        <div className="px-1">
          {workspaceLoadFailed && (
            <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-2">
                  <p>
                    无法加载工作空间数据。请检查前端的后端地址配置，或稍后重试。
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => void refetch()}
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    重新加载
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={displayWorkspace.avatarUrl} />
              <AvatarFallback className="bg-blue-500 text-white font-bold">
                {displayWorkspace.type === "PERSONAL"
                  ? user?.user_metadata.name?.slice(0, 1) ||
                    user?.email?.slice(0, 1).toUpperCase()
                  : displayWorkspace.name.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold">{displayWorkspace.name}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Users className="h-3 w-3" />
                <span>{displayWorkspace.memberCount || 1}位成员</span>
                {currentWorkspace?.type === "TEAM" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 py-0 text-xs"
                    onClick={handleInviteMember}
                  >
                    邀请新成员
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* 用户邮箱 */}
        <div className="px-2 py-2">
          <div className="text-sm text-muted-foreground">
            {user?.email || "用户邮箱"}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* 工作空间列表 */}
        <div className="space-y-1">
          {workspaces.length > 0 ? (
            workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                className="flex items-center gap-3 px-2 py-2 cursor-pointer"
                onClick={() => handleSwitchWorkspace(workspace.id)}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={workspace.avatarUrl} />
                  <AvatarFallback className="bg-gray-500 text-white text-xs">
                    {workspace.type === "PERSONAL"
                      ? user?.user_metadata.name?.slice(0, 1) ||
                        user?.email?.slice(0, 1).toUpperCase()
                      : workspace.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-sm">{workspace.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {workspace.type === "PERSONAL" ? "个人空间" : "团队空间"}
                  </div>
                </div>
                {workspace.isActive && (
                  <Check className="h-4 w-4 text-blue-500" />
                )}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-2 py-2 text-xs text-muted-foreground">
              {error
                ? "工作空间列表请求失败"
                : "当前账号还没有可用的工作空间"}
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* 创建新工作空间 */}
        <DropdownMenuItem
          className="flex items-center gap-3 px-2 py-2 cursor-pointer"
          onClick={handleCreateWorkspace}
        >
          <Plus className="h-4 w-4" />
          <span>Create new workspace</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* 设置 */}
        <DropdownMenuItem
          className="flex items-center gap-3 px-2 py-2 cursor-pointer"
          onClick={handleSettings}
        >
          <Settings className="h-4 w-4" />
          <span>Setting</span>
        </DropdownMenuItem>

        {/* 登出 */}
        <DropdownMenuItem
          className="flex items-center gap-3 px-2 py-2 cursor-pointer"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* 邀请成员对话框 */}
      {currentWorkspace?.type === "TEAM" && (
        <InviteMemberDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          teamId={currentWorkspace.teamId || ""}
          teamName={currentWorkspace.name}
        />
      )}
    </DropdownMenu>
  );
};

export default SidebarBrand;
