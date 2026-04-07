"use client";

import React, { useEffect, useState } from "react";
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
            删除项目
          </DialogTitle>
          <DialogDescription className="text-app-text-secondary">
            删除项目后，该项目内的所有 issues 都会被永久删除，此操作不可恢复。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <div className="text-sm font-medium text-app-text-primary">
              即将删除
            </div>
            <div className="mt-2 text-base font-semibold text-app-text-primary">
              {project?.name || "未选择项目"}
            </div>
            <div className="mt-2 text-sm leading-6 text-app-text-secondary">
              {project?.description || "这个项目当前没有补充描述。"}
            </div>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text-secondary">
            {isLoadingIssues ? (
              <div className="flex items-center gap-2">
                <RiLoader4Line className="size-4 animate-spin" />
                正在统计该项目下将被级联删除的 issues...
              </div>
            ) : (
              <span>
                预计会同时删除{" "}
                <span className="font-semibold text-app-text-primary">
                  {projectIssues.length}
                </span>{" "}
                个相关任务。
              </span>
            )}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-app-text-primary">
              请输入项目名称以确认删除
            </label>
            <Input
              value={confirmationName}
              onChange={(event) => setConfirmationName(event.target.value)}
              placeholder={project?.name || "输入项目名称"}
              className="border-app-border bg-app-bg text-app-text-primary"
            />
            <div className="text-xs text-app-text-muted">
              只有当输入内容与项目名完全一致时，才允许最终删除。
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
            取消
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="bg-red-600 text-white hover:bg-red-500"
            disabled={!project || !isMatched || isDeleting}
            onClick={() => project && onConfirm(project)}
          >
            <RiDeleteBinLine className="size-4" />
            {isDeleting ? "删除中..." : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
