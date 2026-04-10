"use client";

import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { RiCloseLine, RiFlowChart } from "react-icons/ri";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateIssue, useCreateWorkflowIssue } from "@/hooks/useIssueApi";
import { useIssueStates } from "@/hooks/useIssueStates";
import { useProjects } from "@/hooks/useProjectApi";
import { useTeamMemberByUserId, useTeamMembers } from "@/hooks/useTeam";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useWorkflows } from "@/hooks/useWorkflowApi";
import type { CreateIssueDto } from "@/lib/fetchers/issue";
import type { TeamMember } from "@/lib/fetchers/team";
import type { WorkflowResponse } from "@/lib/fetchers/workflow";
import {
  ISSUE_STATE_CATEGORY_LABELS,
  resolveIssueStateForCategory,
} from "@/lib/issue-board";
import { cn } from "@/lib/utils";
import {
  IssuePriority,
  IssueStateCategory,
  VisibilityType,
} from "@/types/prisma";
import type { Workflow } from "@/types/team";

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialProjectId?: string;
  projectContextName?: string;
}

interface MemberOption {
  id: string;
  name: string;
  email: string;
}

const NONE_VALUE = "__none__";
const DEFAULT_PRIORITY_VALUE = "__default_priority__";

const PRIORITY_OPTIONS = [
  { value: DEFAULT_PRIORITY_VALUE, label: "按默认优先级（中）" },
  { value: IssuePriority.LOW, label: "低" },
  { value: IssuePriority.NORMAL, label: "中" },
  { value: IssuePriority.HIGH, label: "高" },
  { value: IssuePriority.URGENT, label: "紧急" },
] as const;

const STATE_CATEGORY_OPTIONS = [
  {
    value: IssueStateCategory.BACKLOG,
    label: ISSUE_STATE_CATEGORY_LABELS[IssueStateCategory.BACKLOG],
  },
  {
    value: IssueStateCategory.TODO,
    label: ISSUE_STATE_CATEGORY_LABELS[IssueStateCategory.TODO],
  },
  {
    value: IssueStateCategory.IN_PROGRESS,
    label: ISSUE_STATE_CATEGORY_LABELS[IssueStateCategory.IN_PROGRESS],
  },
  {
    value: IssueStateCategory.DONE,
    label: ISSUE_STATE_CATEGORY_LABELS[IssueStateCategory.DONE],
  },
  {
    value: IssueStateCategory.CANCELED,
    label: ISSUE_STATE_CATEGORY_LABELS[IssueStateCategory.CANCELED],
  },
] as const;

function getDefaultVisibility(workspaceType: "PERSONAL" | "TEAM") {
  return workspaceType === "TEAM"
    ? VisibilityType.TEAM_EDITABLE
    : VisibilityType.PRIVATE;
}

function getVisibilityOptions(workspaceType: "PERSONAL" | "TEAM") {
  if (workspaceType === "TEAM") {
    return [
      { value: VisibilityType.PRIVATE, label: "仅自己可见" },
      { value: VisibilityType.TEAM_READONLY, label: "团队只读" },
      { value: VisibilityType.TEAM_EDITABLE, label: "团队可编辑" },
    ];
  }

  return [
    { value: VisibilityType.PRIVATE, label: "仅自己可见" },
    { value: VisibilityType.PUBLIC, label: "公开可见" },
  ];
}

function getTeamMemberName(member: TeamMember) {
  return (
    member.user.name?.trim() ||
    member.user.email?.split("@")[0] ||
    `成员 ${member.id.slice(0, 6)}`
  );
}

export default function CreateIssueModal({
  isOpen,
  onClose,
  onCreated,
  initialProjectId,
  projectContextName,
}: CreateIssueModalProps) {
  const { session, user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const workspaceType = currentWorkspace?.type || "PERSONAL";
  const teamId = currentWorkspace?.teamId;
  const currentUserLabel =
    user?.user_metadata?.name?.trim() || user?.email?.split("@")[0] || "当前用户";

  const [issueType, setIssueType] = useState<"normal" | "workflow">("normal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || "");
  const [selectedStateCategory, setSelectedStateCategory] = useState<
    IssueStateCategory | ""
  >("");
  const [selectedPriority, setSelectedPriority] = useState<IssuePriority | "">("");
  const [selectedVisibility, setSelectedVisibility] = useState<VisibilityType>(
    getDefaultVisibility(workspaceType),
  );
  const [directAssigneeId, setDirectAssigneeId] = useState("");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  const { data: workflowResponses = [], isLoading: isLoadingWorkflows } =
    useWorkflows(workspaceId);
  const { data: projects = [], isLoading: isLoadingProjects } =
    useProjects(workspaceId);
  const { data: issueStates = [], isLoading: isLoadingIssueStates } =
    useIssueStates(workspaceId, { enabled: isOpen });
  const { data: teamMembers = [] } = useTeamMembers(teamId);
  const { data: currentUserTeamMember } = useTeamMemberByUserId(session?.user?.id);
  const createIssueMutation = useCreateIssue();
  const createWorkflowIssueMutation = useCreateWorkflowIssue();

  const workflows = workflowResponses.map(
    (workflowResponse: WorkflowResponse): Workflow => {
      const workflow: Workflow = {
        id: workflowResponse.id,
        name: workflowResponse.name,
        description: workflowResponse.description || "",
        nodes: [],
        edges: [],
        createdAt: workflowResponse.createdAt,
        updatedAt: workflowResponse.updatedAt,
        createdBy: workflowResponse.creator?.user?.name || "未知用户",
        isDraft: workflowResponse.status === "DRAFT",
        totalSteps: workflowResponse.totalSteps,
      };

      if (workflowResponse.json) {
        try {
          const parsedData =
            typeof workflowResponse.json === "string"
              ? JSON.parse(workflowResponse.json)
              : workflowResponse.json;

          workflow.nodes = parsedData.nodes || [];
          workflow.edges = parsedData.edges || [];
          workflow.description = parsedData.description || "";
        } catch (error) {
          console.error("解析工作流 JSON 失败:", error);
        }
      }

      return workflow;
    },
  );
  const availableWorkflowTemplates = workflows.filter(
    (workflow) => !workflow.isDraft && (workflow.totalSteps || 0) > 0,
  );

  const teamMemberOptions = useMemo<MemberOption[]>(
    () =>
      teamMembers
        .map((member) => ({
          id: member.id,
          name: getTeamMemberName(member),
          email: member.user.email,
        }))
        .sort((left, right) => left.name.localeCompare(right.name, "zh-CN")),
    [teamMembers],
  );

  const personalAssigneeId = currentUserTeamMember?.id || "";

  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const selectedWorkflow = workflows.find(
    (workflow) => workflow.id === selectedWorkflowId,
  );
  const resolvedState =
    (selectedStateCategory
      ? resolveIssueStateForCategory(issueStates, selectedStateCategory)
      : issueStates.find((state) => state.isDefault) || issueStates[0]) || null;
  const isProjectContext = !!initialProjectId;
  const visibilityOptions = getVisibilityOptions(workspaceType);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedProjectId(initialProjectId || "");
    setSelectedVisibility(getDefaultVisibility(workspaceType));
  }, [initialProjectId, isOpen, workspaceType]);

  useEffect(() => {
    if (!isOpen || issueStates.length === 0 || selectedStateCategory) {
      return;
    }

    const defaultState = issueStates.find((state) => state.isDefault) || issueStates[0];
    if (defaultState) {
      setSelectedStateCategory(defaultState.category);
    }
  }, [isOpen, issueStates, selectedStateCategory]);

  useEffect(() => {
    if (workspaceType !== "PERSONAL") {
      return;
    }

    if (personalAssigneeId) {
      setDirectAssigneeId(personalAssigneeId);
      setSelectedAssigneeIds([personalAssigneeId]);
    }
  }, [personalAssigneeId, workspaceType]);

  useEffect(() => {
    if (workspaceType !== "TEAM" || !directAssigneeId) {
      return;
    }

    setSelectedAssigneeIds((previousIds) =>
      previousIds.includes(directAssigneeId)
        ? previousIds
        : [...previousIds, directAssigneeId],
    );
  }, [directAssigneeId, workspaceType]);

  useEffect(() => {
    if (workspaceType !== "TEAM" || teamMemberOptions.length === 0) {
      return;
    }

    const availableIds = new Set(teamMemberOptions.map((member) => member.id));

    if (directAssigneeId && !availableIds.has(directAssigneeId)) {
      setDirectAssigneeId("");
    }

    setSelectedAssigneeIds((previousIds) =>
      previousIds.filter((memberId) => availableIds.has(memberId)),
    );
  }, [directAssigneeId, teamMemberOptions, workspaceType]);

  const resetForm = () => {
    setIssueType("normal");
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setSelectedWorkflowId("");
    setSelectedProjectId(initialProjectId || "");
    setSelectedStateCategory("");
    setSelectedPriority("");
    setSelectedVisibility(getDefaultVisibility(workspaceType));
    setDirectAssigneeId("");
    setSelectedAssigneeIds([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleToggleAssignee = (memberId: string, checked: boolean) => {
    setSelectedAssigneeIds((previousIds) => {
      if (!checked) {
        if (directAssigneeId === memberId) {
          setDirectAssigneeId("");
        }

        return previousIds.filter((currentId) => currentId !== memberId);
      }

      return previousIds.includes(memberId)
        ? previousIds
        : [...previousIds, memberId];
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("请输入任务标题");
      return;
    }

    if (issueType === "workflow" && !selectedWorkflowId) {
      toast.error("请选择一个工作流模板");
      return;
    }

    if (!session?.access_token) {
      toast.error("无法获取认证信息，请重新登录");
      return;
    }

    if (workspaceType === "PERSONAL" && !personalAssigneeId) {
      toast.error("正在同步你的成员身份，请稍等片刻后再创建");
      return;
    }

    const normalizedAssigneeIds =
      workspaceType === "TEAM"
        ? Array.from(
            new Set([
              ...selectedAssigneeIds,
              ...(directAssigneeId ? [directAssigneeId] : []),
            ]),
          )
        : directAssigneeId
          ? [directAssigneeId]
          : [];

    const issueData: Partial<CreateIssueDto> = {
      title: title.trim(),
      description: description.trim() || undefined,
      workspaceId,
      stateId: resolvedState?.id,
      projectId: selectedProjectId || undefined,
      directAssigneeId: directAssigneeId || undefined,
      priority: selectedPriority || undefined,
      visibility: selectedVisibility,
      dueDate: dueDate
        ? (() => {
            const normalizedDate = new Date(dueDate);
            normalizedDate.setHours(0, 0, 0, 0);
            return normalizedDate.toISOString();
          })()
        : undefined,
      assigneeIds:
        workspaceType === "TEAM" && normalizedAssigneeIds.length > 0
          ? normalizedAssigneeIds
          : undefined,
    };

    try {
      if (issueType === "normal") {
        await createIssueMutation.mutateAsync({
          workspaceId,
          issue: issueData,
        });
      } else {
        await createWorkflowIssueMutation.mutateAsync({
          workspaceId,
          issue: issueData,
          workflowId: selectedWorkflowId,
        });
      }

      onCreated();
      handleClose();
    } catch (error) {
      console.error("创建任务失败:", error);
      toast.error(error instanceof Error ? error.message : "创建任务失败，请重试");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-app-border bg-app-content-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-app-border px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-app-text-primary">
              新建任务
            </h2>
            <p className="mt-1 text-sm text-app-text-secondary">
              {workspaceType === "PERSONAL" ? "个人空间" : "团队空间"}
              {isProjectContext
                ? ` · 当前项目：${projectContextName || selectedProject?.name || "未命名项目"}`
                : ""}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="rounded-xl p-2 text-app-text-secondary transition-colors hover:bg-app-button-hover"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          {workspaceType === "TEAM" && (
            <div>
              <label className="mb-3 block text-sm font-medium text-app-text-primary">
                任务类型
              </label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant={issueType === "normal" ? "default" : "outline"}
                  className={cn(
                    "h-10 rounded-xl",
                    issueType === "normal"
                      ? "bg-sky-600 text-white hover:bg-sky-500"
                      : "border-app-border bg-app-bg text-app-text-primary",
                  )}
                  onClick={() => setIssueType("normal")}
                >
                  普通任务
                </Button>
                <Button
                  type="button"
                  variant={issueType === "workflow" ? "default" : "outline"}
                  className={cn(
                    "h-10 rounded-xl",
                    issueType === "workflow"
                      ? "bg-sky-600 text-white hover:bg-sky-500"
                      : "border-app-border bg-app-bg text-app-text-primary",
                  )}
                  onClick={() => setIssueType("workflow")}
                >
                  基于工作流
                </Button>
              </div>
            </div>
          )}

          {workspaceType === "TEAM" && issueType === "workflow" && (
            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                工作流
              </label>
              <Select
                value={selectedWorkflowId || undefined}
                onValueChange={setSelectedWorkflowId}
                disabled={isLoadingWorkflows}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-app-border bg-app-bg text-app-text-primary">
                  <SelectValue placeholder="选择工作流" />
                </SelectTrigger>
                <SelectContent className="border-app-border bg-app-content-bg">
                  {availableWorkflowTemplates.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedWorkflow && (
                <div className="rounded-2xl border border-app-border bg-app-bg px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-app-text-primary">
                    <RiFlowChart className="h-4 w-4 text-app-text-secondary" />
                    {selectedWorkflow.name}
                  </div>
                  <p className="mt-2 text-sm text-app-text-secondary">
                    {selectedWorkflow.description || "无描述"}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                归属项目
              </label>
              <Select
                value={selectedProjectId || NONE_VALUE}
                onValueChange={(value) =>
                  setSelectedProjectId(value === NONE_VALUE ? "" : value)
                }
                disabled={isLoadingProjects}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-app-border bg-app-bg text-app-text-primary">
                  <SelectValue placeholder="选择项目" />
                </SelectTrigger>
                <SelectContent className="border-app-border bg-app-content-bg">
                  <SelectItem value={NONE_VALUE}>不归属任何项目</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                可见性
              </label>
              <Select
                value={selectedVisibility}
                onValueChange={(value) => setSelectedVisibility(value as VisibilityType)}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-app-border bg-app-bg text-app-text-primary">
                  <SelectValue placeholder="选择可见性" />
                </SelectTrigger>
                <SelectContent className="border-app-border bg-app-content-bg">
                  {visibilityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-app-text-primary">
              标题
            </label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="输入任务标题..."
              className="h-11 rounded-xl border-app-border bg-app-bg text-app-text-primary"
              autoFocus
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
              placeholder="输入详细描述..."
              className="min-h-28 rounded-2xl border-app-border bg-app-bg text-app-text-primary"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                状态分类
              </label>
              <Select
                value={selectedStateCategory || undefined}
                onValueChange={(value) =>
                  setSelectedStateCategory(value as IssueStateCategory)
                }
                disabled={isLoadingIssueStates || issueStates.length === 0}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-app-border bg-app-bg text-app-text-primary">
                  <SelectValue placeholder="选择状态分类" />
                </SelectTrigger>
                <SelectContent className="border-app-border bg-app-content-bg">
                  {STATE_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                优先级
              </label>
              <Select
                value={selectedPriority || DEFAULT_PRIORITY_VALUE}
                onValueChange={(value) =>
                  setSelectedPriority(
                    value === DEFAULT_PRIORITY_VALUE ? "" : (value as IssuePriority),
                  )
                }
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-app-border bg-app-bg text-app-text-primary">
                  <SelectValue placeholder="选择优先级" />
                </SelectTrigger>
                <SelectContent className="border-app-border bg-app-content-bg">
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-app-text-primary">
                截止日期
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 justify-start rounded-xl border-app-border bg-app-bg text-left font-normal text-app-text-primary hover:bg-app-button-hover",
                      !dueDate && "text-app-text-muted",
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {dueDate ? format(dueDate, "yyyy-MM-dd") : "选择截止日期"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto rounded-2xl border-app-border bg-app-content-bg p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                  {dueDate && (
                    <div className="border-t border-app-border p-3">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 px-2 text-app-text-secondary"
                        onClick={() => setDueDate(undefined)}
                      >
                        清除日期
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-bg px-4 py-4">
            <div className="mb-4">
              <div className="text-sm font-medium text-app-text-primary">负责人</div>
              <p className="mt-1 text-xs text-app-text-muted">
                {workspaceType === "PERSONAL"
                  ? "个人空间里负责人固定为你自己。"
                  : "团队空间里可以从当前团队全部成员中选择。"}
              </p>
            </div>

            {workspaceType === "PERSONAL" ? (
              <div className="rounded-2xl border border-app-border bg-app-content-bg px-4 py-3">
                <div className="text-sm font-medium text-app-text-primary">
                  {currentUserLabel}
                </div>
                <div className="mt-1 text-xs text-app-text-secondary">
                  {user?.email || "当前登录用户"}
                </div>
                <div className="mt-2 text-xs text-app-text-muted">
                  {personalAssigneeId
                    ? "创建后会自动归到你的个人工作队列。"
                    : "正在同步你的成员身份，稍后即可创建。"}
                </div>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-app-text-primary">
                    主负责人
                  </label>
                  <Select
                    value={directAssigneeId || NONE_VALUE}
                    onValueChange={(value) =>
                      setDirectAssigneeId(value === NONE_VALUE ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl border-app-border bg-app-content-bg text-app-text-primary">
                      <SelectValue placeholder="选择主负责人" />
                    </SelectTrigger>
                    <SelectContent className="border-app-border bg-app-content-bg">
                      <SelectItem value={NONE_VALUE}>暂不指定负责人</SelectItem>
                      {teamMemberOptions.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-app-text-primary">
                    协作成员
                  </label>
                  <div className="max-h-44 space-y-2 overflow-y-auto rounded-2xl border border-app-border bg-app-content-bg p-3">
                    {teamMemberOptions.length === 0 ? (
                      <p className="text-sm text-app-text-muted">当前没有可选成员。</p>
                    ) : (
                      teamMemberOptions.map((member) => (
                        <label
                          key={member.id}
                          className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-app-button-hover"
                        >
                          <Checkbox
                            checked={selectedAssigneeIds.includes(member.id)}
                            onCheckedChange={(checked) =>
                              handleToggleAssignee(member.id, checked === true)
                            }
                            className="mt-0.5"
                          />
                          <div className="min-w-0">
                            <div className="text-sm text-app-text-primary">
                              {member.name}
                            </div>
                            <div className="truncate text-xs text-app-text-muted">
                              {member.email}
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-app-border pt-5">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-app-border bg-transparent text-app-text-primary"
              onClick={handleClose}
            >
              取消
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-sky-600 text-white hover:bg-sky-500"
              disabled={
                createIssueMutation.isPending ||
                createWorkflowIssueMutation.isPending
              }
            >
              {createIssueMutation.isPending || createWorkflowIssueMutation.isPending
                ? "创建中..."
                : "创建任务"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
