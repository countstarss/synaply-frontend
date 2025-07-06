import { Users, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TeamMember } from "@/lib/fetchers/team";
import { ContactItem } from "./ContactItem";
import { GroupChatCreator } from "./GroupChatCreator";

interface ContactListProps {
  teamMembers: TeamMember[];
  isLoadingMembers: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isCreatingGroup: boolean;
  selectedMembers: string[];
  groupName: string;
  onToggleGroupCreation: () => void;
  onMemberToggle: (memberId: string) => void;
  onGroupNameChange: (name: string) => void;
  onCreateGroup: () => void;
  onDoubleClick: (member: TeamMember) => void;
}

export function ContactList({
  teamMembers,
  isLoadingMembers,
  searchQuery,
  onSearchChange,
  isCreatingGroup,
  selectedMembers,
  groupName,
  onToggleGroupCreation,
  onMemberToggle,
  onGroupNameChange,
  onCreateGroup,
  onDoubleClick,
}: ContactListProps) {
  // 过滤团队成员
  const filteredMembers = teamMembers.filter(
    (member: TeamMember) =>
      member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* 群聊创建器 */}
      <div className="p-4 border-b">
        <GroupChatCreator
          isCreating={isCreatingGroup}
          selectedMembers={selectedMembers}
          groupName={groupName}
          onToggleCreation={onToggleGroupCreation}
          onMemberToggle={onMemberToggle}
          onGroupNameChange={onGroupNameChange}
          onCreateGroup={onCreateGroup}
        />

        {/* 搜索框 */}
        <div className="mt-3">
          <Input
            placeholder="搜索联系人"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8"
          />
        </div>
      </div>

      {/* 联系人列表 */}
      {isLoadingMembers ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {searchQuery ? "未找到匹配的联系人" : "暂无团队成员"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {filteredMembers.map((member: TeamMember) => (
            <ContactItem
              key={member.id}
              member={member}
              isSelected={selectedMembers.includes(member.id)}
              isCreatingGroup={isCreatingGroup}
              onDoubleClick={onDoubleClick}
              onToggle={onMemberToggle}
            />
          ))}
        </div>
      )}

      {/* 联系人操作提示 */}
      {!isCreatingGroup && filteredMembers.length > 0 && (
        <div className="p-4 text-center border-t">
          <p className="text-xs text-muted-foreground">双击联系人开始私聊</p>
        </div>
      )}
    </>
  );
}
