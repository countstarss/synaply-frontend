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
import type { TeamMember } from "@/lib/fetchers/team";
import { ProjectRiskLevel, ProjectStatus } from "@/types/prisma";

const PROJECT_STATUS_OPTIONS: Array<{
  value: ProjectStatus;
  label: string;
  description: string;
}> = [
  {
    value: ProjectStatus.PLANNING,
    label: "规划中",
    description: "目标和范围还在收敛，适合补 brief、定义成功标准。",
  },
  {
    value: ProjectStatus.ACTIVE,
    label: "推进中",
    description: "已有执行节奏，适合作为团队协作主上下文。",
  },
  {
    value: ProjectStatus.BLOCKED,
    label: "阻塞中",
    description: "存在关键卡点，需要尽快明确解阻责任人。",
  },
  {
    value: ProjectStatus.SHIPPING,
    label: "发布中",
    description: "工作已进入发布、验收或上线收尾阶段。",
  },
  {
    value: ProjectStatus.DONE,
    label: "已完成",
    description: "目标已经达成，适合保留为历史上下文。",
  },
  {
    value: ProjectStatus.ARCHIVED,
    label: "已归档",
    description: "项目已退出日常协作视野，但上下文仍需保留。",
  },
];

const PROJECT_RISK_OPTIONS: Array<{
  value: ProjectRiskLevel;
  label: string;
  description: string;
}> = [
  {
    value: ProjectRiskLevel.LOW,
    label: "低风险",
    description: "节奏稳定，暂未出现明显的交接或延期风险。",
  },
  {
    value: ProjectRiskLevel.MEDIUM,
    label: "中风险",
    description: "已有等待或不确定项，建议在项目页持续跟踪。",
  },
  {
    value: ProjectRiskLevel.HIGH,
    label: "高风险",
    description: "交付、评审或协调存在明显风险，需要重点关注。",
  },
  {
    value: ProjectRiskLevel.CRITICAL,
    label: "关键风险",
    description: "项目推进已受到明显影响，需要立刻介入处理。",
  },
];

export interface ProjectEditorValues {
  name: string;
  description?: string;
  brief?: string;
  status: ProjectStatus;
  phase?: string;
  riskLevel: ProjectRiskLevel;
  ownerMemberId?: string;
  visibility: ProjectVisibility;
}

interface ProjectEditorDialogProps {
  open: boolean;
  mode: "create" | "edit";
  workspaceType: "PERSONAL" | "TEAM";
  initialProject?: Project | null;
  teamMembers?: TeamMember[];
  defaultOwnerMemberId?: string | null;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ProjectEditorValues) => void | Promise<void>;
}

export function ProjectEditorDialog({
  open,
  mode,
  workspaceType,
  initialProject,
  teamMembers = [],
  defaultOwnerMemberId,
  isPending = false,
  onOpenChange,
  onSubmit,
}: ProjectEditorDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brief, setBrief] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [phase, setPhase] = useState("");
  const [riskLevel, setRiskLevel] = useState<ProjectRiskLevel>(
    ProjectRiskLevel.LOW,
  );
  const [ownerMemberId, setOwnerMemberId] = useState("");
  const [visibility, setVisibility] = useState<ProjectVisibility>(
    getDefaultProjectVisibility(workspaceType),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(initialProject?.name ?? "");
    setDescription(initialProject?.description ?? "");
    setBrief(initialProject?.brief ?? "");
    setStatus(initialProject?.status ?? ProjectStatus.ACTIVE);
    setPhase(initialProject?.phase ?? "");
    setRiskLevel(initialProject?.riskLevel ?? ProjectRiskLevel.LOW);
    setOwnerMemberId(
      initialProject?.ownerMemberId ?? defaultOwnerMemberId ?? "",
    );
    setVisibility(
      initialProject?.visibility ?? getDefaultProjectVisibility(workspaceType),
    );
  }, [defaultOwnerMemberId, initialProject, open, workspaceType]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      brief: brief.trim() || undefined,
      status,
      phase: phase.trim() || undefined,
      riskLevel,
      ownerMemberId: ownerMemberId || undefined,
      visibility,
    });
  };

  const title = mode === "create" ? "新建项目" : "编辑项目";
  const subtitle =
    mode === "create"
      ? "把项目建成协作上下文，而不是单纯的 issue 容器。"
      : "这里可以维护项目 brief、阶段、风险和负责人等协作语义。";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl border-app-border bg-app-content-bg p-0 shadow-2xl"
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
                一句话 Brief
              </label>
              <Input
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                placeholder="一句话说明这个项目为什么存在，以及团队要把什么推进到交付。"
                className="border-app-border bg-app-bg text-app-text-primary"
                maxLength={240}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                项目背景 / 目标说明
              </label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="补充范围、成功标准、关键背景，帮助团队理解项目语境。"
                className="min-h-28 border-app-border bg-app-bg text-app-text-primary"
                maxLength={500}
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-app-text-primary">
                  当前状态
                </label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as ProjectStatus)}
                >
                  <SelectTrigger className="h-11 w-full border-app-border bg-app-bg text-app-text-primary">
                    <SelectValue placeholder="选择项目状态" />
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    {PROJECT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-app-text-primary">
                  当前阶段
                </label>
                <Input
                  value={phase}
                  onChange={(event) => setPhase(event.target.value)}
                  placeholder="例如：Kickoff、Design Review、Build、Launch"
                  className="border-app-border bg-app-bg text-app-text-primary"
                  maxLength={120}
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-app-text-primary">
                  风险等级
                </label>
                <Select
                  value={riskLevel}
                  onValueChange={(value) =>
                    setRiskLevel(value as ProjectRiskLevel)
                  }
                >
                  <SelectTrigger className="h-11 w-full border-app-border bg-app-bg text-app-text-primary">
                    <SelectValue placeholder="选择风险等级" />
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    {PROJECT_RISK_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {teamMembers.length > 0 ? (
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-app-text-primary">
                    项目负责人
                  </label>
                  <Select
                    value={ownerMemberId}
                    onValueChange={(value) => setOwnerMemberId(value)}
                  >
                    <SelectTrigger className="h-11 w-full border-app-border bg-app-bg text-app-text-primary">
                      <SelectValue placeholder="选择负责人" />
                    </SelectTrigger>
                    <SelectContent className="border-app-border bg-app-content-bg">
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.user.name || member.user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
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
