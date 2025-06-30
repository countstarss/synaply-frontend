"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./chat-message";
import { useAuth } from "@/context/AuthContext";

const messages = [
  {
    id: "1",
    userId: "1",
    userName: "John Doe",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&auto=format",
    content: "Hey everyone! 👋",
    createdAt: new Date().getTime(),
  },
  {
    id: "2",
    userId: "2",
    userName: "Jane Smith",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&auto=format",
    content: "Welcome to the server!",
    createdAt: new Date().getTime(),
  },
  {
    id: "3",
    userId: "3",
    userName: "John Doe",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&auto=format",
    content: "Hey everyone! 👋",
    createdAt: new Date().getTime(),
  },
  {
    id: "4",
    userId: "4",
    userName: "Jane Smith",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&auto=format",
    content: "Welcome to the server!",
    createdAt: new Date().getTime(),
  }
];

export function ChatMessageList() {

  const { session } = useAuth();
  if (!session) return null;
  
  return (
    <ScrollArea className="flex-1 p-4 bg-[#313338]">
      <div className="flex flex-col gap-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isOwn={message.userId === session.user?.id}
            onUserClick={() => {}}
          />
        ))}
      </div>
    </ScrollArea>
  );
}