"use client";

import React, { useEffect, useState } from "react";
import { RiFolder2Line, RiSparklingLine } from "react-icons/ri";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PROJECT_VISIBILITY_OPTIONS,
  Project,
  ProjectVisibility,
  getDefaultProjectVisibility,
} from "@/lib/fetchers/project";

export interface ProjectEditorValues {
  name: string;
  description?: string;
  visibility: ProjectVisibility;
}

interface ProjectEditorDialogProps {
  open: boolean;
  mode: "create" | "edit";
  workspaceType: "PERSONAL" | "TEAM";
  initialProject?: Project | null;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProjectEditorValues) => void | Promise<void>;
}

export function ProjectEditorDialog({
  open,
  mode,
  workspaceType,
  initialProject,
  isPending = false,
  onOpenChange,
  onSubmit,
}: ProjectEditorDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ProjectVisibility>(
    getDefaultProjectVisibility(workspaceType),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(initialProject?.name ?? "");
    setDescription(initialProject?.description ?? "");
    setVisibility(
      initialProject?.visibility ?? getDefaultProjectVisibility(workspaceType),
    );
  }, [initialProject, open, workspaceType]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      visibility,
    });
  };

  const title = mode === "create" ? "新建项目" : "编辑项目";
  const subtitle =
    mode === "create"
      ? "Project 只归属于当前 workspace。默认可见性已按后端规则预设。"
      : "仅更新后端允许修改的字段：名称、描述与可见性。";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl border-app-border bg-app-content-bg p-0 shadow-2xl"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-app-border px-6 py-5">
          <DialogTitle className="flex items-center gap-3 text-app-text-primary">
            <span className="flex size-10 items-center justify-center rounded-2xl border border-app-border bg-app-bg text-app-text-primary">
              {mode === "create" ? (
                <RiSparklingLine className="size-5" />
              ) : (
                <RiFolder2Line className="size-5" />
              )}
            </span>
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-app-text-secondary">
            {subtitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                项目名称
              </label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="例如：Q2 Launch, AI Search Revamp"
                className="border-app-border bg-app-bg text-app-text-primary"
                autoFocus
                maxLength={100}
                required
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                描述
              </label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="补充项目目标、背景或本阶段需要追踪的事项。"
                className="min-h-28 border-app-border bg-app-bg text-app-text-primary"
                maxLength={500}
              />
            </div>

            <div className="grid gap-3">
              <label className="text-sm font-medium text-app-text-primary">
                可见性
              </label>
              <Select
                value={visibility}
                onValueChange={(value) =>
                  setVisibility(value as ProjectVisibility)
                }
              >
                <SelectTrigger className="h-11 w-full border-app-border bg-app-bg text-app-text-primary">
                  <SelectValue placeholder="选择项目可见性" />
                </SelectTrigger>
                <SelectContent className="border-app-border bg-app-content-bg">
                  {PROJECT_VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid gap-2 rounded-2xl border border-app-border bg-app-bg px-4 py-3">
                {PROJECT_VISIBILITY_OPTIONS.map((option) => {
                  const isActive = option.value === visibility;

                  return (
                    <div
                      key={option.value}
                      className={
                        isActive
                          ? "rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2"
                          : "rounded-xl px-3 py-2"
                      }
                    >
                      <div className="text-sm font-medium text-app-text-primary">
                        {option.label}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-app-text-secondary">
                        {option.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-app-border pt-5">
            <Button
              type="button"
              variant="outline"
              className="border-app-border bg-transparent text-app-text-primary"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              取消
            </Button>
            <Button
              type="submit"
              className="bg-sky-600 text-white hover:bg-sky-500"
              disabled={isPending || !name.trim()}
            >
              {isPending
                ? mode === "create"
                  ? "创建中..."
                  : "保存中..."
                : mode === "create"
                  ? "创建项目"
                  : "保存更改"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
