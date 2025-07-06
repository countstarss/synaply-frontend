"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeam } from "@/hooks/useTeam";
import { toast } from "sonner";
import { Users } from "lucide-react";

interface CreateTeamDialogProps {
  children: React.ReactNode;
}

export const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const { createTeam, isCreatingTeam } = useTeam();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error("请输入团队名称");
      return;
    }

    try {
      await createTeam({ name: teamName.trim() });
      toast.success("团队创建成功！");
      setOpen(false);
      setTeamName("");
    } catch (error) {
      console.error("创建团队失败:", error);
      toast.error(`创建团队失败，请重试: ${error}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            创建团队
          </DialogTitle>
          <DialogDescription>
            创建一个新团队来与同事协作。团队将自动创建一个专属的工作空间。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">团队名称</Label>
            <Input
              id="team-name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="输入团队名称"
              disabled={isCreatingTeam}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isCreatingTeam}
            >
              取消
            </Button>
            <Button type="submit" disabled={isCreatingTeam}>
              {isCreatingTeam ? "创建中..." : "创建团队"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
