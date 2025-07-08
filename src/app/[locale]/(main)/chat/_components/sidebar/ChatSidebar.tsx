"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/context/AuthContext";
import { useCurrentTeam, useTeamMembers } from "@/hooks/useTeam";
import { TeamMember } from "@/lib/fetchers/team";
import { ViewMode } from "./types";
import { SidebarHeader } from "./SidebarHeader";
import { ChatList } from "./ChatList";
import { ContactList } from "./ContactList";
import { ChatChannel } from "./ChatItem";

export function ChatSidebar() {
  const [viewMode, setViewMode] = useState<ViewMode>("chats");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const { session } = useAuth();

  // 使用 React Query 获取团队数据
  const { team: currentTeam } = useCurrentTeam();
  const { data: teamMembers = [], isLoading: isLoadingMembers } =
    useTeamMembers(currentTeam?.id);

  // 获取用户的频道列表
  const channels = useQuery(
    api.channels.getUserChannels,
    session?.user?.id ? { userId: session.user.id } : "skip"
  );

  // Convex mutations
  const createDirectMessage = useMutation(api.channels.createDirectMessage);
  const createGroupChat = useMutation(api.channels.createGroupChat);
  const syncUser = useMutation(api.users.syncUser);

  // 同步当前用户信息到 Convex
  useEffect(() => {
    if (session?.user?.id && session?.user?.email) {
      syncUser({
        userId: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || undefined,
        avatarUrl: session.user.user_metadata?.avatar_url || undefined,
      }).catch((error) => {
        console.error("用户信息同步失败:", error);
      });
    }
  }, [
    session?.user?.id,
    session?.user?.email,
    session?.user?.user_metadata?.name,
    session?.user?.user_metadata?.avatar_url,
    syncUser,
  ]);

  // 转换频道数据为 ChatChannel 格式
  const chats: ChatChannel[] = (channels || [])
    .filter((channel) => channel !== null)
    .map((channel) => {
      let otherParticipantId: string | undefined;

      // 对于私聊，尝试从频道名称中解析出另一个参与者ID
      if (channel.type === "direct" && session?.user?.id) {
        // 私聊频道名称格式是 "user1_user2"，需要找到不是当前用户的那个ID
        const participants = channel.name.split("_");
        otherParticipantId = participants.find((id) => id !== session.user.id);
      }

      return {
        _id: channel._id,
        name: channel.name,
        type: channel.type,
        chatType: channel.chatType,
        createdAt: channel.createdAt,
        lastMessage: channel.lastMessage
          ? {
              content: channel.lastMessage.content,
              createdAt: channel.lastMessage.createdAt,
              userName: channel.lastMessage.userName,
            }
          : null,
        memberCount: channel.memberCount,
        otherParticipantId,
      };
    });

  // 处理聊天点击
  const handleChatClick = (chat: ChatChannel) => {
    router.push(`/chat?channelId=${chat._id}`);
  };

  const handlePublicChatClick = () => {
    router.push("/chat");
  };

  // 切换到联系人视图
  const handleContactsView = () => {
    setViewMode("contacts");
    setIsCreatingGroup(false);
    setSelectedMembers([]);
    setGroupName("");
    setSearchQuery("");
  };

  // 切换到聊天视图
  const handleChatsView = () => {
    setViewMode("chats");
    setIsCreatingGroup(false);
    setSelectedMembers([]);
    setGroupName("");
    setSearchQuery("");
  };

  // 同步团队成员到 Convex
  const syncTeamMemberToConvex = async (member: TeamMember) => {
    try {
      await syncUser({
        userId: member.userId,
        email: member.user.email,
        name: member.user.name || undefined,
        avatarUrl: member.user.avatar_url || undefined,
      });
    } catch (error) {
      console.error("同步团队成员信息失败:", error);
    }
  };

  // 双击创建私聊
  const handleDoubleClick = async (member: TeamMember) => {
    if (isCreatingGroup || !session?.user?.id) return;

    try {
      // 确保团队成员信息已同步到 Convex
      await syncTeamMemberToConvex(member);

      const channelId = await createDirectMessage({
        participantIds: [session.user.id, member.userId],
      });

      toast.success("已开始私聊");
      router.push(`/chat?channelId=${channelId}`);
      handleChatsView();
    } catch (error) {
      console.error("Error creating private chat:", error);
      toast.error("创建私聊失败");
    }
  };

  // 切换群聊创建模式
  const handleToggleGroupCreation = () => {
    setIsCreatingGroup(!isCreatingGroup);
    setSelectedMembers([]);
    setGroupName("");
  };

  // 处理成员选择
  const handleMemberToggle = (memberId: string) => {
    if (!isCreatingGroup) return;

    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  // 创建群聊
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("请输入群聊名称");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("请至少选择一个成员");
      return;
    }

    if (!session?.user?.id) {
      toast.error("用户未登录");
      return;
    }

    try {
      // 获取选中的成员并同步到 Convex
      const selectedTeamMembers = selectedMembers
        .map((memberId) => teamMembers.find((m) => m.id === memberId))
        .filter(Boolean) as TeamMember[];

      // 同步所有选中成员的信息到 Convex
      await Promise.all(
        selectedTeamMembers.map((member) => syncTeamMemberToConvex(member))
      );

      // 获取选中成员的用户ID
      const selectedUserIds = selectedTeamMembers.map(
        (member) => member.userId
      );

      const channelId = await createGroupChat({
        name: groupName,
        description: `由 ${
          session.user.user_metadata?.name || session.user.email
        } 创建的群聊`,
        creatorId: session.user.id,
        memberIds: selectedUserIds,
      });

      toast.success("群聊创建成功");
      router.push(`/chat?channelId=${channelId}`);
      handleChatsView();
    } catch (error) {
      console.error("Error creating group chat:", error);
      toast.error("创建群聊失败");
    }
  };

  return (
    <Card className="w-80 h-full rounded-none border-r border-l-0 border-t-0 border-b-0 flex flex-col">
      {/* 侧边栏头部 */}
      <SidebarHeader
        viewMode={viewMode}
        onContactsView={handleContactsView}
        onChatsView={handleChatsView}
      />

      {/* 内容区域 */}
      <ScrollArea className="flex-1">
        {viewMode === "chats" ? (
          <ChatList
            chats={chats}
            isLoading={channels === undefined}
            onChatClick={handleChatClick}
            onPublicChatClick={handlePublicChatClick}
          />
        ) : (
          <ContactList
            teamMembers={teamMembers}
            isLoadingMembers={isLoadingMembers}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isCreatingGroup={isCreatingGroup}
            selectedMembers={selectedMembers}
            groupName={groupName}
            onToggleGroupCreation={handleToggleGroupCreation}
            onMemberToggle={handleMemberToggle}
            onGroupNameChange={setGroupName}
            onCreateGroup={handleCreateGroup}
            onDoubleClick={handleDoubleClick}
          />
        )}
      </ScrollArea>

      {/* 底部信息 */}
      <Separator />
      <div className="p-4 text-center text-sm text-muted-foreground">
        {currentTeam && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>当前团队: {currentTeam.name}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
