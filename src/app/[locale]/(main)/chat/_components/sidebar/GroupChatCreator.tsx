import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Check } from "lucide-react";
import { GroupChatCreatorProps } from "./types";

export function GroupChatCreator({
  isCreating,
  selectedMembers,
  groupName,
  onToggleCreation,
  onGroupNameChange,
  onCreateGroup,
}: GroupChatCreatorProps) {
  return (
    <div className="mt-3 space-y-2">
      {isCreating && (
        <Input
          placeholder="输入群聊名称"
          value={groupName}
          onChange={(e) => onGroupNameChange(e.target.value)}
          className="h-8"
        />
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={isCreating ? "default" : "outline"}
          onClick={onToggleCreation}
          className="flex-1"
        >
          <Users className="h-3 w-3 mr-1" />
          {isCreating ? "取消群聊" : "创建群聊"}
        </Button>
        {isCreating && (
          <Button
            size="sm"
            onClick={onCreateGroup}
            disabled={!groupName.trim() || selectedMembers.length === 0}
            className="flex-1"
          >
            <Check className="h-3 w-3 mr-1" />
            确认创建
          </Button>
        )}
      </div>
      {isCreating && (
        <p className="text-xs text-muted-foreground text-center">
          已选择 {selectedMembers.length} 人
        </p>
      )}
    </div>
  );
}
