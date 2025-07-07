"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCurrentTeam, useTeamMembers } from "@/hooks/useTeam";
import { TeamMember } from "@/lib/fetchers/team";
import { ViewMode } from "./types";
import { SidebarHeader } from "./SidebarHeader";
import { ChatList } from "./ChatList";
import { ContactList } from "./ContactList";

export function ChatSidebar() {
  const [viewMode, setViewMode] = useState<ViewMode>("chats");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  // 使用 React Query 获取团队数据
  const { team: currentTeam } = useCurrentTeam();
  const {
    data: teamMembers = [],
    isLoading: isLoadingMembers,
    error: membersError,
  } = useTeamMembers(currentTeam?.id);

  // 使用新的聊天hooks
  // const { data: chats = [], isLoading, error: chatsError } = useUserChats();
  // const createGroupChatMutation = useCreateGroupChat();
  // const createPrivateChatMutation = useCreatePrivateChat();

  // 处理聊天点击
  const handleChatClick = (chat: any) => {
    router.push(`/chat/${chat.id}`);
  };

  const handlePublicChatClick = () => {
    router.push("/chat/public");
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

  // 双击创建私聊
  const handleDoubleClick = async (member: TeamMember) => {
    if (isCreatingGroup) return;

    try {
      // const result = await createPrivateChatMutation.mutateAsync({
      //   targetMemberId: member.id,
      // });

      toast.success("已开始私聊");
      // router.push(`/chat/${result.id}`);
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

    try {
      // const result = await createGroupChatMutation.mutateAsync({
      //   name: groupName,
      //   memberIds: selectedMembers,
      // });

      toast.success("群聊创建成功");
      // router.push(`/chat/${result.id}`);
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
            // TODO: 后续更新chats来源, 全面切换到Convex
            chats={[]}
            isLoading={false}
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
