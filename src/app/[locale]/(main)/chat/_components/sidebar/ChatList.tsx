import { MessageCircle, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { ChatAvatar } from "./types";
import { ChatItem, ChatChannel } from "./ChatItem";
import { PublicChatItem } from "./PublicChatItem";
import {
  useUserInfo,
  getUserDisplayName,
  getUserAvatar,
} from "@/hooks/useUser";

interface ChatListProps {
  chats: ChatChannel[];
  isLoading: boolean;
  onChatClick: (chat: ChatChannel) => void;
  onPublicChatClick: () => void;
}

// 单个聊天项组件，支持私聊用户信息获取
function ChatItemWithUserInfo({
  chat,
  isActive,
  onChatClick,
}: {
  chat: ChatChannel;
  isActive: boolean;
  onChatClick: (chat: ChatChannel) => void;
}) {
  // 对于私聊，获取对方用户信息
  const { data: otherUser } = useUserInfo(
    chat.type === "direct" ? chat.otherParticipantId : undefined
  );

  // 获取聊天显示名称
  const getChatDisplayName = () => {
    if (chat.type === "group") {
      return chat.name || "群聊";
    } else if (chat.type === "direct") {
      return getUserDisplayName(otherUser);
    } else {
      return chat.name;
    }
  };

  // 获取聊天头像
  const getChatAvatar = (): ChatAvatar => {
    if (chat.type === "group") {
      return {
        src: `https://avatar.vercel.sh/${chat.name || "group"}`,
        fallback: chat.name?.[0]?.toUpperCase() || "G",
      };
    } else if (chat.type === "direct") {
      return getUserAvatar(otherUser);
    } else {
      return {
        src: `https://avatar.vercel.sh/${chat.name}`,
        fallback: chat.name?.[0]?.toUpperCase() || "C",
      };
    }
  };

  const displayName = getChatDisplayName();
  const avatar = getChatAvatar();

  return (
    <ChatItem
      chat={chat}
      displayName={displayName}
      avatar={avatar}
      isActive={isActive}
      onClick={() => onChatClick(chat)}
    />
  );
}

export function ChatList({
  chats,
  isLoading,
  onChatClick,
  onPublicChatClick,
}: ChatListProps) {
  const pathname = usePathname();

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
            const isActive = isCurrentChat(chat._id);

            return (
              <ChatItemWithUserInfo
                key={chat._id}
                chat={chat}
                isActive={isActive}
                onChatClick={onChatClick}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
