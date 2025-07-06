export type ViewMode = "chats" | "contacts";

export interface ChatAvatar {
  src: string;
  fallback: string;
}

export interface GroupChatCreatorProps {
  isCreating: boolean;
  selectedMembers: string[];
  groupName: string;
  onToggleCreation: () => void;
  onMemberToggle: (memberId: string) => void;
  onGroupNameChange: (name: string) => void;
  onCreateGroup: () => void;
}
