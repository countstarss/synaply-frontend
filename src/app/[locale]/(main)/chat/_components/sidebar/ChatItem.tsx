import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChatResult } from "@/hooks/useChat";
import { ChatAvatar } from "./types";

interface ChatItemProps {
  chat: ChatResult;
  displayName: string;
  avatar: ChatAvatar;
  isActive: boolean;
  onClick: () => void;
}

export function ChatItem({
  chat,
  displayName,
  avatar,
  isActive,
  onClick,
}: ChatItemProps) {
  // 获取最后一条消息预览 - 暂时显示占位符
  const getLastMessagePreview = () => {
    return "点击查看聊天";
  };

  // 格式化时间
  const formatLastMessageTime = () => {
    return formatDistanceToNow(new Date(chat.createdAt), {
      addSuffix: true,
      locale: zhCN,
    });
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-colors",
        "hover:bg-muted/50",
        isActive && "bg-primary/10 border border-primary/20"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={avatar.src} />
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium truncate">{displayName}</h3>
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatLastMessageTime()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground truncate flex-1">
              {getLastMessagePreview()}
            </p>

            {chat.type === "GROUP" && (
              <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
