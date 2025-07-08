import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "./types";
import { Id } from "@/convex/_generated/dataModel";

// 定义聊天频道类型，基于Convex schema
interface ChatChannel {
  _id: Id<"channels">;
  name: string;
  type: "team_public" | "team_private" | "group" | "direct";
  chatType: "text" | "voice" | "video";
  createdAt: number;
  lastMessage?: {
    content: string;
    createdAt: number;
    userName: string;
  } | null;
  memberCount: number;
  // 私聊时的另一个参与者ID
  otherParticipantId?: string;
}

interface ChatItemProps {
  chat: ChatChannel;
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
  // 获取最后一条消息预览
  const getLastMessagePreview = () => {
    if (chat.lastMessage) {
      return `${chat.lastMessage.userName}: ${chat.lastMessage.content}`;
    }
    return "点击查看聊天";
  };

  // 格式化时间
  const formatLastMessageTime = () => {
    const time = chat.lastMessage?.createdAt || chat.createdAt;
    return formatDistanceToNow(new Date(time), {
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

            {chat.type === "group" && (
              <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { ChatChannel };
