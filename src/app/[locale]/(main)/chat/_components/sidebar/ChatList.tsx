import { MessageCircle, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { ChatAvatar } from "./types";
import { ChatItem } from "./ChatItem";
import { PublicChatItem } from "./PublicChatItem";

interface ChatListProps {
  chats: any[];
  isLoading: boolean;
  onChatClick: (chat: any) => void;
  onPublicChatClick: () => void;
}

export function ChatList({
  chats,
  isLoading,
  onChatClick,
  onPublicChatClick,
}: ChatListProps) {
  const pathname = usePathname();

  // 获取聊天显示名称
  const getChatDisplayName = (chat: any) => {
    if (chat.type === "GROUP") {
      return chat.name || "群聊";
    } else {
      // 对于私聊，暂时显示"私聊"，因为当前API返回的聊天列表不包含成员信息
      return "私聊";
    }
  };

  // 获取聊天头像
  const getChatAvatar = (chat: any): ChatAvatar => {
    if (chat.type === "GROUP") {
      return {
        src: `https://avatar.vercel.sh/${chat.name || "group"}`,
        fallback: chat.name?.[0]?.toUpperCase() || "G",
      };
    } else {
      // 对于私聊，暂时使用默认头像
      return {
        src: `https://avatar.vercel.sh/user`,
        fallback: "U",
      };
    }
  };

  // 判断是否为当前聊天
  const isCurrentChat = (chatId: string) => {
    return pathname === `/chat/${chatId}`;
  };

  return (
    <>
      {/* 公共聊天 */}
      <PublicChatItem onClick={onPublicChatClick} />

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : chats.length === 0 ? (
        <div className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <MessageCircle className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">暂无聊天</p>
              <p className="text-xs text-muted-foreground">
                点击联系人按钮开始聊天
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2 space-y-1">
          {chats.map((chat) => {
            const displayName = getChatDisplayName(chat);
            const avatar = getChatAvatar(chat);
            const isActive = isCurrentChat(chat.id);

            return (
              <ChatItem
                key={chat.id}
                chat={chat}
                displayName={displayName}
                avatar={avatar}
                isActive={isActive}
                onClick={() => onChatClick(chat)}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
