"use client";

import React from "react";
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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useRouter } from "@/i18n/navigation";

interface SidebarBrandProps {
  className?: string;
}

const SidebarBrand = ({ className }: SidebarBrandProps) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { workspaces, currentWorkspace, loading, switchWorkspace } =
    useWorkspace();

  const handleLogout = async () => {
    await signOut();
  };

  const handleInviteMember = () => {
    // TODO: 打开邀请成员对话框
    console.log("邀请新成员到工作空间:", currentWorkspace?.name);
  };

  const handleCreateWorkspace = () => {
    // TODO: 打开创建工作空间对话框
    console.log("创建新工作空间");
  };

  const handleSettings = () => {
    // TODO: 导航到设置页面
    router.push("/settings");
  };

  // 加载状态
  if (loading || !currentWorkspace) {
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
        <div className="w-full p-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between px-4 py-3 h-auto hover:bg-app-button-hover",
              className
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentWorkspace.avatarUrl} />
                <AvatarFallback className="bg-white text-black font-bold text-sm">
                  {user?.user_metadata.name
                    ? user?.user_metadata.name.slice(0, 1)
                    : user?.email?.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start select-none">
                <span className="font-semibold text-lg">
                  {user?.user_metadata.name || user?.email?.split("@")[0]}
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
        {/* FIXME: 新注册用户默认只有一个工作区, 私人工作区没有TEAM, 所以这里需要判断 */}
        {/* FIXME: 组织者可以在自己的账号中创建一个team, 这样的话, 其他用户可以加入这个team, 自然而然就有了这个team的工作区 */}
        {/* FIXME:  */}

        <div className="px-1">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentWorkspace.avatarUrl} />
              <AvatarFallback className="bg-blue-500 text-white font-bold">
                {user?.user_metadata.name
                  ? user?.user_metadata.name.slice(0, 1)
                  : user?.email?.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold">{user?.user_metadata.name}</div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{currentWorkspace.memberCount || 1}位成员</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 py-0 text-xs"
                  onClick={handleInviteMember}
                >
                  邀请新成员
                </Button>
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
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              className="flex items-center gap-3 px-2 py-2 cursor-pointer"
              onClick={() => switchWorkspace(workspace.id)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={workspace.avatarUrl} />
                <AvatarFallback className="bg-gray-500 text-white text-xs">
                  {workspace.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1">{workspace.name}</span>
              {workspace.isActive && (
                <Check className="h-4 w-4 text-blue-500" />
              )}
            </DropdownMenuItem>
          ))}
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
    </DropdownMenu>
  );
};

export default SidebarBrand;
