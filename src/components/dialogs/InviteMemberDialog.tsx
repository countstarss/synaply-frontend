import React, { useState } from "react";
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
import { inviteTeamMember } from "@/lib/fetchers/team";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, UserPlus } from "lucide-react";
import { InviteMemberDto } from "@/api";
import { useTranslations } from "next-intl";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  teamId,
  teamName,
}: InviteMemberDialogProps) {
  const tDialogs = useTranslations("dialogs");
  const tCommon = useTranslations("common");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error(tDialogs("inviteMember.validation.emailRequired"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(tDialogs("inviteMember.validation.emailInvalid"));
      return;
    }

    setIsLoading(true);

    try {
      const inviteData: InviteMemberDto = { email };
      await inviteTeamMember(teamId, inviteData, session!.access_token);

      toast.success(tDialogs("inviteMember.toasts.sent", { email, teamName }));

      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });

      setEmail("");
      onOpenChange(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : tDialogs("inviteMember.toasts.sendFailed");
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {tDialogs("inviteMember.title")}
          </DialogTitle>
          <DialogDescription>
            {tDialogs("inviteMember.description", { teamName })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              {tDialogs("inviteMember.emailLabel")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder={tDialogs("inviteMember.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {tDialogs("inviteMember.emailHint")}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading || !email.trim()}>
              {isLoading
                ? tDialogs("inviteMember.actions.sending")
                : tDialogs("inviteMember.actions.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
