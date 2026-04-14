"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RiAlertLine, RiDeleteBinLine, RiLoader4Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useIssues } from "@/hooks/useIssueApi";
import { Project } from "@/lib/fetchers/project";

interface DeleteProjectDialogProps {
  open: boolean;
  workspaceId: string;
  project: Project | null;
  isDeleting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (project: Project) => void | Promise<void>;
}

export function DeleteProjectDialog({
  open,
  workspaceId,
  project,
  isDeleting = false,
  onOpenChange,
  onConfirm,
}: DeleteProjectDialogProps) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const [confirmationName, setConfirmationName] = useState("");
  const { data: projectIssues = [], isLoading: isLoadingIssues } = useIssues(
    workspaceId,
    { projectId: project?.id },
    { enabled: open && !!workspaceId && !!project?.id },
  );

  useEffect(() => {
    if (!open) {
      setConfirmationName("");
    }
  }, [open, project?.id]);

  const isMatched = confirmationName === project?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg border-app-border bg-app-content-bg p-0 shadow-2xl"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-app-border px-6 py-5">
          <DialogTitle className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <span className="flex size-10 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
              <RiAlertLine className="size-5" />
            </span>
            {t("deleteDialog.title")}
          </DialogTitle>
          <DialogDescription className="text-app-text-secondary">
            {t("deleteDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="text-sm font-medium text-app-text-primary">
              {t("deleteDialog.aboutToDelete")}
            </div>
            <div className="mt-2 text-base font-semibold text-app-text-primary">
              {project?.name || t("deleteDialog.missingProject")}
            </div>
            <div className="mt-2 text-sm leading-6 text-app-text-secondary">
              {project?.description || t("deleteDialog.missingProjectDescription")}
            </div>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text-secondary">
            {isLoadingIssues ? (
              <div className="flex items-center gap-2">
                <RiLoader4Line className="size-4 animate-spin" />
                {t("deleteDialog.countingIssues")}
              </div>
            ) : (
              <span>
                {t("deleteDialog.issueCount", { count: projectIssues.length })}
              </span>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-app-text-primary">
              {t("deleteDialog.confirmLabel")}
            </label>
            <Input
              value={confirmationName}
              onChange={(event) => setConfirmationName(event.target.value)}
              placeholder={project?.name || t("deleteDialog.confirmPlaceholder")}
              className="border-app-border bg-app-bg text-app-text-primary"
            />
            <div className="text-xs text-app-text-muted">
              {t("deleteDialog.confirmHint")}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-app-border px-6 py-5">
          <Button
            type="button"
            variant="outline"
            className="border-app-border bg-transparent text-app-text-primary"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {tCommon("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="bg-red-600 text-white hover:bg-red-500"
            disabled={!project || !isMatched || isDeleting}
            onClick={() => project && onConfirm(project)}
          >
            <RiDeleteBinLine className="size-4" />
            {isDeleting
              ? t("deleteDialog.deleting")
              : t("deleteDialog.confirmDelete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
