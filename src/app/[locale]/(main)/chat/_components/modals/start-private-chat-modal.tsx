"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClientComponentClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserListItem } from "../../_components/common/UserListItem"; // Re-use UserListItem
import { cn } from "@/lib/utils";

interface StartPrivateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock user data for demonstration
const MOCK_ALL_USERS = [
  {
    id: "user-1",
    username: "Alice",
    avatarUrl: "https://avatar.vercel.sh/alice",
    isOnline: true,
  },
  {
    id: "user-2",
    username: "Bob",
    avatarUrl: "https://avatar.vercel.sh/bob",
    isOnline: false,
  },
  {
    id: "user-3",
    username: "Charlie",
    avatarUrl: "https://avatar.vercel.sh/charlie",
    isOnline: true,
  },
  {
    id: "user-4",
    username: "David",
    avatarUrl: "https://avatar.vercel.sh/david",
    isOnline: false,
  },
  {
    id: "user-5",
    username: "Eve",
    avatarUrl: "https://avatar.vercel.sh/eve",
    isOnline: true,
  },
];

export function StartPrivateChatModal({
  isOpen,
  onClose,
}: StartPrivateChatModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState(MOCK_ALL_USERS);
  const [selectedUser, setSelectedUser] = useState<
    (typeof MOCK_ALL_USERS)[0] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { session } = useAuth();

  useEffect(() => {
    // Filter users based on search term
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = MOCK_ALL_USERS.filter((user) =>
      user.username.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredUsers(filtered);
  }, [searchTerm]);

  const handleStartChat = async () => {
    if (!selectedUser) {
      toast.error("请选择一个用户。");
      return;
    }

    if (!session?.user?.id) {
      toast.error("用户未登录。");
      return;
    }

    setIsLoading(true);
    try {
      // Check if a private chat already exists between these two users
      // This is a simplified check. In a real app, you'd query chat_members table for a chat with exactly these two participants.
      const { data: existingChats, error: existingChatError } = await supabase
        .from("chats")
        .select("id, participants") // Assuming 'participants' is a JSONB array or similar in Supabase
        .eq("type", "private");

      if (existingChatError) {
        throw new Error(existingChatError.message || "查询现有私聊失败");
      }

      let existingChatId: string | null = null;
      if (existingChats) {
        for (const chat of existingChats) {
          const chatParticipants = chat.participants as string[]; // Cast to string array
          if (
            chatParticipants.includes(session.user.id) &&
            chatParticipants.includes(selectedUser.id) &&
            chatParticipants.length === 2
          ) {
            existingChatId = chat.id;
            break;
          }
        }
      }

      let newChatId: string;

      if (existingChatId) {
        newChatId = existingChatId;
        toast.info("已存在与该用户的私聊，将直接跳转。");
      } else {
        // Create new private chat
        const { data: chatData, error: chatError } = await supabase
          .from("chats")
          .insert({
            type: "private",
            participants: [session.user.id, selectedUser.id], // Store participants directly
          })
          .select()
          .single();

        if (chatError || !chatData) {
          throw new Error(chatError?.message || "创建私聊失败");
        }
        newChatId = chatData.id;

        // Add members to chat_members table (optional, if you prefer a separate table for members)
        // This part depends on your Supabase schema design. If 'participants' array in 'chats' is enough, you can skip this.
        // For this example, we'll assume 'participants' in 'chats' is sufficient for private chats.
        // If chat_members is strictly needed for private chats too:
        // await supabase.from('chat_members').insert([
        //   { chat_id: newChatId, user_id: session.user.id },
        //   { chat_id: newChatId, user_id: selectedUser.id },
        // ]);

        toast.success(`已与 ${selectedUser.username} 开始私聊！`);
      }

      setSearchTerm("");
      setSelectedUser(null);
      onClose();
      router.push(`/chat/${newChatId}`);
    } catch (error) {
      console.error("开始私聊失败:", error);
      toast.error(
        error instanceof Error ? error.message : "开始私聊时发生未知错误。"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>开始私聊</DialogTitle>
          <DialogDescription>搜索用户并开始一对一聊天。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="searchUser" className="text-right">
              搜索用户
            </Label>
            <Input
              id="searchUser"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="col-span-3"
              placeholder="输入用户名..."
              disabled={isLoading}
            />
          </div>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground">
                没有找到用户。
              </p>
            ) : (
              filteredUsers.map((user) => (
                <UserListItem
                  key={user.id}
                  username={user.username}
                  avatarUrl={user.avatarUrl}
                  isOnline={user.isOnline}
                  onClick={() => setSelectedUser(user)}
                  className={cn(
                    "cursor-pointer",
                    selectedUser?.id === user.id && "bg-accent"
                  )}
                />
              ))
            )}
          </ScrollArea>
          {selectedUser && (
            <div className="text-center text-sm text-muted-foreground">
              已选择:{" "}
              <span className="font-semibold text-foreground">
                {selectedUser.username}
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button
            onClick={handleStartChat}
            disabled={isLoading || !selectedUser}
          >
            {isLoading ? "开始中..." : "开始聊天"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
