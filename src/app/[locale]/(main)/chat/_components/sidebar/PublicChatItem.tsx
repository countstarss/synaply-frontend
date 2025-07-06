import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface PublicChatItemProps {
  onClick: () => void;
}

export function PublicChatItem({ onClick }: PublicChatItemProps) {
  return (
    <div
      className={cn(
        "p-3 cursor-pointer transition-colors",
        "border-b border-primary/20 hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src="https://avatar.vercel.sh/public" />
          <AvatarFallback>G</AvatarFallback>
        </Avatar>
        <div className="flex h-full items-center">
          <h3 className="text-sm font-medium truncate">公共聊天</h3>
        </div>
      </div>
    </div>
  );
}
