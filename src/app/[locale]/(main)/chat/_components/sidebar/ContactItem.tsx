import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TeamMember } from "@/lib/fetchers/team";

interface ContactItemProps {
  member: TeamMember;
  isSelected: boolean;
  isCreatingGroup: boolean;
  onDoubleClick: (member: TeamMember) => void;
  onToggle: (memberId: string) => void;
}

export function ContactItem({
  member,
  isSelected,
  isCreatingGroup,
  onDoubleClick,
  onToggle,
}: ContactItemProps) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-colors",
        "hover:bg-muted/50 flex items-center gap-3",
        isCreatingGroup &&
          isSelected &&
          "bg-primary/10 border border-primary/20"
      )}
      onDoubleClick={() => onDoubleClick(member)}
      onClick={() => onToggle(member.id)}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={member.user.avatar_url} />
        <AvatarFallback>
          {member.user.name?.[0]?.toUpperCase() ||
            member.user.email[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium truncate">
          {member.user.name || member.user.email}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {member.user.email}
        </p>
      </div>

      {isCreatingGroup && (
        <div className="flex-shrink-0">
          {isSelected ? (
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          ) : (
            <div className="w-5 h-5 border border-muted-foreground rounded" />
          )}
        </div>
      )}
    </div>
  );
}
