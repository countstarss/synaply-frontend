import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { MessageSquare, UserPlus } from "lucide-react";

interface ChatMessageProps {
  message: {
    content: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    createdAt: number;
  };
  isOwn: boolean;
  onUserClick?: (userId: string) => void;
}

export function ChatMessage({
  message, 
  isOwn, 
  onUserClick
}: ChatMessageProps) {
  return (
    <div className={cn(
      "flex items-start gap-2",
      isOwn && "flex-row-reverse"
    )}>
      <div className="relative group">
        <Avatar 
          className="cursor-pointer"
          onClick={() => onUserClick?.(message.userId)}
        >
          <AvatarImage src={message.userAvatar} />
          <AvatarFallback>{message.userName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        
        {!isOwn && (
          <div className="absolute hidden group-hover:flex -bottom-2 -right-2 gap-1">
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-6 w-6"
              onClick={() => onUserClick?.(message.userId)}
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-6 w-6"
            >
              <UserPlus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <div className={cn(
        "flex flex-col",
        isOwn && "items-end"
      )}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{message.userName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(message.createdAt, {
              addSuffix: true,
              locale: zhCN,
            })}
          </span>
        </div>
        <div className={cn(
          "mt-1 rounded-lg p-2 max-w-md break-words",
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}>
          {message.content}
        </div>
      </div>
    </div>
  );
}