"use client";

import { useState } from "react";
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

interface CreateGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupChatModal({
  isOpen,
  onClose,
}: CreateGroupChatModalProps) {
  const [groupName, setGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { session } = useAuth();

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("群聊名称不能为空。");
      return;
    }

    if (!session?.user?.id) {
      toast.error("用户未登录。");
      return;
    }

    setIsLoading(true);
    try {
      // 1. 创建群聊
      const { data: chatData, error: chatError } = await supabase
        .from("chats")
        .insert({
          type: "group",
          name: groupName,
        })
        .select()
        .single();

      if (chatError || !chatData) {
        throw new Error(chatError?.message || "创建群聊失败");
      }

      const newChatId = chatData.id;

      // 2. 添加创建者为群成员
      const { error: memberError } = await supabase
        .from("chat_members")
        .insert({
          chat_id: newChatId,
          user_id: session.user.id,
          is_admin: true, // 创建者默认为管理员
        });

      if (memberError) {
        throw new Error(memberError?.message || "添加群成员失败");
      }

      toast.success(`群聊 "${groupName}" 创建成功！`);

      setGroupName("");
      onClose();
      router.push(`/chat/${newChatId}`); // 跳转到新创建的群聊
    } catch (error) {
      console.error("创建群聊失败:", error);
      toast.error(
        error instanceof Error ? error.message : "创建群聊时发生未知错误。"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建群聊</DialogTitle>
          <DialogDescription>为你的新群聊起一个名字。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="groupName" className="text-right">
              群聊名称
            </Label>
            <Input
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleCreateGroup} disabled={isLoading}>
            {isLoading ? "创建中..." : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
