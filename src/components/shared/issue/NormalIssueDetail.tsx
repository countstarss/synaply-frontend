"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  RiArrowLeftLine,
  RiCalendarLine,
  RiCloseLine,
  RiEditLine,
  RiFileTextLine,
  RiPriceTagLine,
  RiSaveLine,
  RiTimeLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useIssue, useUpdateIssue } from "@/hooks/useIssueApi";
import { useIssueStates } from "@/hooks/useIssueStates";
import { useProjects } from "@/hooks/useProjectApi";
import { useIssueRealtime } from "@/hooks/realtime/useIssueRealtime";
import { useTeamMemberByUserId, useTeamMembers } from "@/hooks/useTeam";
import { useWorkspace } from "@/hooks/useWorkspace";
import DiscussionTab from "@/components/issue/tabs/DiscussionTab";
import { Issue, IssueAssigneeMember } from "@/lib/fetchers/issue";
import type { TeamMember } from "@/lib/fetchers/team";
import { cn } from "@/lib/utils";
import { IssuePriority, VisibilityType } from "@/types/prisma";

interface NormalIssueDetailProps {
  issueId: string;
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedIssue: Issue) => void;
  displayMode?: "dialog" | "page";
}

interface MemberOption {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

const PRIORITY_OPTIONS = [
  { value: IssuePriority.LOW, label: "低", color: "bg-gray-100 text-gray-700" },
  {
    value: IssuePriority.NORMAL,
    label: "中",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    value: IssuePriority.HIGH,
    label: "高",
    color: "bg-orange-100 text-orange-700",
  },
  {
    value: IssuePriority.URGENT,
    label: "紧急",
    color: "bg-red-100 text-red-700",
  },
] as const;

const VISIBILITY_OPTIONS = [
  { value: VisibilityType.PRIVATE, label: "仅自己可见" },
  { value: VisibilityType.TEAM_READONLY, label: "团队只读" },
  { value: VisibilityType.TEAM_EDITABLE, label: "团队可编辑" },
  { value: VisibilityType.PUBLIC, label: "公开可见" },
] as const;

const EMPTY_PRIORITY_VALUE = "__empty_priority__";
const EMPTY_PROJECT_VALUE = "__empty_project__";
const EMPTY_ASSIGNEE_VALUE = "__empty_assignee__";

function getTeamMemberName(member: TeamMember) {
  return (
    member.user.name?.trim() ||
    member.user.email?.split("@")[0] ||
    `成员 ${member.id.slice(0, 6)}`
  );
}

function getIssueMemberName(member?: IssueAssigneeMember | null) {
  return (
    member?.user?.name?.trim() ||
    member?.user?.email?.split("@")[0] ||
    `成员 ${member?.id?.slice(0, 6) || "未知"}`
  );
}

function formatDate(dateString?: string | null) {
  if (!dateString) {
    return "未设置";
  }

  return new Date(dateString).toLocaleString("zh-CN");
}

function formatDateOnly(dateString?: string | null) {
  if (!dateString) {
    return "未设置";
  }

  return new Date(dateString).toLocaleDateString("zh-CN");
}

function toUtcMidnightIso(date: Date) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  ).toISOString();
}

function getPriorityOption(priority?: IssuePriority | null) {
  return PRIORITY_OPTIONS.find((option) => option.value === priority) || null;
}

// TO AGENTS: 不要破坏这个组件的整体布局和样式, 增减一些内容或者字段是 OK 的。
export default function NormalIssueDetail({
  issueId,
  workspaceId,
  isOpen,
  onClose,
  onUpdate,
}: NormalIssueDetailProps) {
  const { user } = useAuth();
  const { data: issue, isLoading: isLoadingIssue } = useIssue(workspaceId, issueId, {
    enabled: isOpen,
  });
  const { currentWorkspace } = useWorkspace();
  const workspaceType = currentWorkspace?.type || "PERSONAL";
  const teamId = currentWorkspace?.teamId;
  const currentUserName =
    user?.user_metadata?.name?.trim() || user?.email?.split("@")[0] || "匿名用户";
  const {
    getEditorsForField,
    setEditingField: setRealtimeEditingField,
  } = useIssueRealtime(issueId, workspaceId, {
    enabled: isOpen,
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [committedIssue, setCommittedIssue] = useState<Issue | null>(issue ?? null);
  const [localIssue, setLocalIssue] = useState<Issue | null>(issue ?? null);

  const { data: projects = [] } = useProjects(workspaceId);
  const { data: issueStates = [] } = useIssueStates(workspaceId, {
    enabled: isOpen,
  });
  const { data: teamMembers = [] } = useTeamMembers(teamId);
  const { data: currentUserTeamMember } = useTeamMemberByUserId(user?.id);
  const updateIssueMutation = useUpdateIssue();

  const memberMap = new Map<string, MemberOption>();

  for (const member of teamMembers) {
    memberMap.set(member.id, {
      id: member.id,
      name: getTeamMemberName(member),
      email: member.user.email,
      avatarUrl: member.user.avatar_url,
    });
  }

  for (const assignee of localIssue?.assignees || []) {
    if (!memberMap.has(assignee.memberId)) {
      memberMap.set(assignee.memberId, {
        id: assignee.memberId,
        name: getIssueMemberName(assignee.member),
        email: assignee.member?.user?.email || "",
        avatarUrl:
          assignee.member?.user?.avatar_url ||
          assignee.member?.user?.avatarUrl ||
          undefined,
      });
    }
  }

  const memberOptions = Array.from(memberMap.values()).sort((left, right) =>
    left.name.localeCompare(right.name, "zh-CN"),
  );
  const discussionMembers = React.useMemo(() => {
    const members = new Map(memberOptions.map((member) => [member.id, member]));

    if (currentUserTeamMember?.id) {
      members.set(currentUserTeamMember.id, {
        id: currentUserTeamMember.id,
        name: currentUserName,
        email: user?.email || "",
        avatarUrl: user?.user_metadata?.avatar_url,
      });
    }

    return Array.from(members.values());
  }, [currentUserName, currentUserTeamMember?.id, memberOptions, user?.email, user?.user_metadata?.avatar_url]);
  const personalDirectAssignee =
    workspaceType === "PERSONAL" &&
    localIssue?.directAssigneeId &&
    currentUserTeamMember?.id === localIssue?.directAssigneeId
      ? {
          id: currentUserTeamMember.id,
          name: currentUserName,
          email: user?.email || "",
        }
      : null;
  const directAssignee = memberOptions.find(
    (member) => member.id === localIssue?.directAssigneeId,
  ) || personalDirectAssignee;
  const selectedProject = projects.find(
    (project) => project.id === localIssue?.projectId,
  );
  const selectedState = issueStates.find((state) => state.id === localIssue?.stateId);
  const currentPriority = getPriorityOption(localIssue?.priority);
  const dueDateValue = localIssue?.dueDate
    ? new Date(localIssue.dueDate ?? "")
    : undefined;

  useEffect(() => {
    if (issue) {
      setCommittedIssue(issue);
      setLocalIssue((current) => (editingField ? current ?? issue : issue));
      return;
    }

    if (!isLoadingIssue) {
      setCommittedIssue(null);
      setLocalIssue(null);
      setEditingField(null);
    }
  }, [editingField, isLoadingIssue, issue]);

  useEffect(() => {
    const realtimeField =
      editingField === "stateId"
        ? "state"
        : editingField === "directAssigneeId"
          ? "assignee"
          : editingField === "title" ||
              editingField === "description" ||
              editingField === "priority" ||
              editingField === "dueDate"
            ? editingField
            : null;

    setRealtimeEditingField(realtimeField);

    return () => {
      setRealtimeEditingField(null);
    };
  }, [editingField, setRealtimeEditingField]);

  const handleFieldEdit = (field: string) => {
    setEditingField(field);
  };

  const handleCancelEdit = () => {
    if (committedIssue) {
      setLocalIssue(committedIssue);
    }
    setEditingField(null);
  };

  const persistIssuePatch = async (
    patch: Partial<Issue>,
    relationOverrides: Partial<Issue> = {},
  ) => {
    if (!workspaceId || !committedIssue) {
      toast.error("当前工作空间无效，无法保存 Issue");
      return;
    }

    const sanitizedPatch = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ) as Partial<Issue>;

    if (Object.keys(sanitizedPatch).length === 0) {
      handleCancelEdit();
      return;
    }

    try {
      const updatedIssue = await updateIssueMutation.mutateAsync({
        workspaceId,
        issueId: committedIssue.id,
        data: sanitizedPatch,
      });

      const mergedIssue: Issue = {
        ...committedIssue,
        ...sanitizedPatch,
        ...updatedIssue,
        ...relationOverrides,
      };

      setCommittedIssue(mergedIssue);
      setLocalIssue(mergedIssue);
      setEditingField(null);
      onUpdate(mergedIssue);
      toast.success("Issue 已保存");
    } catch (error) {
      console.error("更新 Issue 失败:", error);
      toast.error(error instanceof Error ? error.message : "更新 Issue 失败，请重试");
    }
  };

  const renderEditingHint = (field: "title" | "state" | "priority" | "assignee" | "dueDate" | "description") => {
    const editors = getEditorsForField(field);

    if (editors.length === 0) {
      return null;
    }

    return (
      <div className="text-xs text-amber-600">
        {editors.map((participant) => participant.name).join("、")} 正在编辑该字段
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  if (isLoadingIssue || !localIssue || !committedIssue) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-lg border border-app-border bg-app-content-bg text-app-text-muted">
        <div>{isLoadingIssue ? "正在加载 Issue..." : "Issue 不存在或已被删除"}</div>
        {!isLoadingIssue && (
          <Button
            type="button"
            variant="outline"
            className="border-app-border bg-transparent text-app-text-primary"
            onClick={onClose}
          >
            <RiArrowLeftLine className="h-4 w-4" />
            返回列表
          </Button>
        )}
      </div>
    );
  }

  const content = (
    <div className="flex h-full flex-col gap-2">
      <Card className="flex-shrink-0 border-app-border bg-app-content-bg shadow-none">
        <CardHeader className="flex flex-row items-start justify-between gap-4 p-4">
          <div className="space-y-2">
            <CardTitle className="text-xl text-app-text-primary">
              {localIssue.title}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm text-app-text-muted">
              <span>{localIssue.key || `#${localIssue.id}`}</span>
              {selectedState && (
                <Badge
                  variant="secondary"
                  className="bg-app-button-hover text-app-text-primary"
                >
                  {selectedState.name}
                </Badge>
              )}
              {currentPriority && (
                <Badge
                  variant="outline"
                  className={cn("border-transparent", currentPriority.color)}
                >
                  {currentPriority.label}
                </Badge>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-lg text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
            onClick={onClose}
          >
            <RiCloseLine className="h-5 w-5" />
          </Button>
        </CardHeader>
      </Card>

      <div className="flex min-h-0 flex-1 gap-2">
        <Card className="flex w-2/3 flex-col border-app-border bg-app-content-bg shadow-none">
          <CardHeader className="border-b border-app-border p-4">
            <CardTitle className="text-lg text-app-text-primary">
              Issue 详情
            </CardTitle>
          </CardHeader>

          <ScrollArea className="flex-1">
            <CardContent className="space-y-6 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-app-text-primary">标题</Label>
                  {editingField !== "title" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-md text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
                      onClick={() => handleFieldEdit("title")}
                    >
                      <RiEditLine className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {renderEditingHint("title")}

                {editingField === "title" ? (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={localIssue.title}
                      onChange={(event) =>
                        setLocalIssue({
                          ...localIssue,
                          title: event.target.value,
                        })
                      }
                      className="flex-1 border-app-border bg-app-bg text-app-text-primary"
                      autoFocus
                    />
                    <Button
                      type="button"
                      className="bg-sky-600 text-white hover:bg-sky-500"
                      onClick={() =>
                        persistIssuePatch({ title: localIssue.title })
                      }
                    >
                      <RiSaveLine className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-app-border bg-transparent text-app-text-primary"
                      onClick={handleCancelEdit}
                    >
                      <RiCloseLine className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <h3 className="text-lg font-medium text-app-text-primary">
                    {localIssue.title}
                  </h3>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="border-b border-app-border pb-2 text-sm font-medium text-app-text-primary">
                  Issue 属性
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-app-text-secondary">
                      状态
                    </Label>
                    {renderEditingHint("state")}
                    {editingField === "stateId" ? (
                      <div className="flex gap-2">
                        <Select
                          value={localIssue.stateId ?? undefined}
                          onValueChange={(value) => {
                            const nextState = issueStates.find(
                              (state) => state.id === value,
                            );

                            setLocalIssue({
                              ...localIssue,
                              stateId: value,
                              state: nextState || null,
                            });
                          }}
                        >
                          <SelectTrigger className="w-full border-app-border bg-app-bg text-app-text-primary">
                            <SelectValue placeholder="选择状态" />
                          </SelectTrigger>
                          <SelectContent className="border-app-border bg-app-content-bg">
                            {issueStates.map((state) => (
                              <SelectItem key={state.id} value={state.id}>
                                {state.name} ({state.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          className="bg-sky-600 text-white hover:bg-sky-500"
                          onClick={() =>
                            persistIssuePatch(
                              { stateId: localIssue.stateId || undefined },
                              { state: localIssue.state || null },
                            )
                          }
                        >
                          <RiSaveLine className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start px-2 py-1 text-left text-sm text-app-text-primary hover:bg-app-button-hover"
                        onClick={() => handleFieldEdit("stateId")}
                      >
                        {localIssue.state?.name || "未设置"}
                        {localIssue.state?.category
                          ? ` · ${localIssue.state.category}`
                          : ""}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-app-text-secondary">
                      优先级
                    </Label>
                    {renderEditingHint("priority")}
                    {editingField === "priority" ? (
                      <div className="flex gap-2">
                        <Select
                          value={localIssue.priority ?? EMPTY_PRIORITY_VALUE}
                          onValueChange={(value) =>
                            setLocalIssue({
                              ...localIssue,
                              priority:
                                value === EMPTY_PRIORITY_VALUE
                                  ? undefined
                                  : (value as IssuePriority),
                            })
                          }
                        >
                          <SelectTrigger className="w-full border-app-border bg-app-bg text-app-text-primary">
                            <SelectValue placeholder="选择优先级" />
                          </SelectTrigger>
                          <SelectContent className="border-app-border bg-app-content-bg">
                            <SelectItem value={EMPTY_PRIORITY_VALUE}>
                              未设置
                            </SelectItem>
                            {PRIORITY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          className="bg-sky-600 text-white hover:bg-sky-500"
                          onClick={() =>
                            persistIssuePatch({
                              priority: localIssue.priority,
                            })
                          }
                        >
                          <RiSaveLine className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start px-2 py-1 text-left text-sm text-app-text-primary hover:bg-app-button-hover"
                        onClick={() => handleFieldEdit("priority")}
                      >
                        {currentPriority?.label || "未设置"}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="gap-1 text-xs text-app-text-secondary">
                      <RiPriceTagLine className="h-3 w-3" />
                      项目
                    </Label>
                    {editingField === "projectId" ? (
                      <div className="flex gap-2">
                        <Select
                          value={localIssue.projectId ?? EMPTY_PROJECT_VALUE}
                          onValueChange={(value) => {
                            const nextProjectId =
                              value === EMPTY_PROJECT_VALUE ? null : value;
                            const nextProject = projects.find(
                              (project) => project.id === nextProjectId,
                            );

                            setLocalIssue({
                              ...localIssue,
                              projectId: nextProjectId,
                              project: nextProject || null,
                            });
                          }}
                        >
                          <SelectTrigger className="w-full border-app-border bg-app-bg text-app-text-primary">
                            <SelectValue placeholder="选择项目" />
                          </SelectTrigger>
                          <SelectContent className="border-app-border bg-app-content-bg">
                            <SelectItem value={EMPTY_PROJECT_VALUE}>
                              不归属任何项目
                            </SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          className="bg-sky-600 text-white hover:bg-sky-500"
                          onClick={() =>
                            persistIssuePatch(
                              { projectId: localIssue.projectId ?? null },
                              { project: localIssue.project || null },
                            )
                          }
                        >
                          <RiSaveLine className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start px-2 py-1 text-left text-sm text-app-text-primary hover:bg-app-button-hover"
                        onClick={() => handleFieldEdit("projectId")}
                      >
                        {selectedProject?.name || localIssue.project?.name || "未设置"}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-app-text-secondary">
                      可见性
                    </Label>
                    {editingField === "visibility" ? (
                      <div className="flex gap-2">
                        <Select
                          value={localIssue.visibility ?? undefined}
                          onValueChange={(value) =>
                            setLocalIssue({
                              ...localIssue,
                              visibility: value as VisibilityType,
                            })
                          }
                        >
                          <SelectTrigger className="w-full border-app-border bg-app-bg text-app-text-primary">
                            <SelectValue placeholder="选择可见性" />
                          </SelectTrigger>
                          <SelectContent className="border-app-border bg-app-content-bg">
                            {VISIBILITY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          className="bg-sky-600 text-white hover:bg-sky-500"
                          onClick={() =>
                            persistIssuePatch({
                              visibility: localIssue.visibility,
                            })
                          }
                        >
                          <RiSaveLine className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start px-2 py-1 text-left text-sm text-app-text-primary hover:bg-app-button-hover"
                        onClick={() => handleFieldEdit("visibility")}
                      >
                        {VISIBILITY_OPTIONS.find(
                          (option) => option.value === localIssue.visibility,
                        )?.label || "未设置"}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-app-text-secondary">
                      主负责人
                    </Label>
                    {renderEditingHint("assignee")}
                    {workspaceType === "PERSONAL" ? (
                      <Badge
                        variant="outline"
                        className="h-auto w-fit rounded-md border-app-border px-3 py-2 text-sm font-normal text-app-text-primary"
                      >
                        {directAssignee?.name || currentUserName}
                      </Badge>
                    ) : editingField === "directAssigneeId" ? (
                      <div className="flex gap-2">
                        <Select
                          value={
                            localIssue.directAssigneeId ?? EMPTY_ASSIGNEE_VALUE
                          }
                          onValueChange={(value) =>
                            setLocalIssue({
                              ...localIssue,
                              directAssigneeId:
                                value === EMPTY_ASSIGNEE_VALUE ? null : value,
                            })
                          }
                        >
                          <SelectTrigger className="w-full border-app-border bg-app-bg text-app-text-primary">
                            <SelectValue placeholder="选择负责人" />
                          </SelectTrigger>
                          <SelectContent className="border-app-border bg-app-content-bg">
                            <SelectItem value={EMPTY_ASSIGNEE_VALUE}>
                              暂不指定负责人
                            </SelectItem>
                            {memberOptions.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          className="bg-sky-600 text-white hover:bg-sky-500"
                          onClick={() =>
                            persistIssuePatch({
                              directAssigneeId:
                                localIssue.directAssigneeId ?? null,
                            })
                          }
                        >
                          <RiSaveLine className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start px-2 py-1 text-left text-sm text-app-text-primary hover:bg-app-button-hover"
                        onClick={() => handleFieldEdit("directAssigneeId")}
                      >
                        {directAssignee?.name || "未分配"}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="gap-1 text-xs text-app-text-secondary">
                      <RiCalendarLine className="h-3 w-3" />
                      截止日期
                    </Label>
                    {renderEditingHint("dueDate")}
                    {editingField === "dueDate" ? (
                      <div className="flex flex-wrap gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1 justify-start border-app-border bg-app-bg text-left font-normal text-app-text-primary hover:bg-app-bg"
                            >
                              <CalendarIcon className="h-4 w-4 text-app-text-secondary" />
                              {dueDateValue
                                ? format(dueDateValue, "yyyy-MM-dd")
                                : "选择日期"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="w-auto border-app-border bg-app-content-bg p-0"
                          >
                            <Calendar
                              mode="single"
                              selected={dueDateValue}
                              onSelect={(date) =>
                                setLocalIssue({
                                  ...localIssue,
                                  dueDate: date ? toUtcMidnightIso(date) : null,
                                })
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-app-border bg-transparent text-app-text-primary"
                          onClick={() =>
                            setLocalIssue({
                              ...localIssue,
                              dueDate: null,
                            })
                          }
                        >
                          清空
                        </Button>
                        <Button
                          type="button"
                          className="bg-sky-600 text-white hover:bg-sky-500"
                          onClick={() =>
                            persistIssuePatch({
                              dueDate: localIssue.dueDate ?? null,
                            })
                          }
                        >
                          <RiSaveLine className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start px-2 py-1 text-left text-sm text-app-text-primary hover:bg-app-button-hover"
                        onClick={() => handleFieldEdit("dueDate")}
                      >
                        {formatDateOnly(localIssue.dueDate)}
                      </Button>
                    )}
                  </div>

                  {(localIssue.assignees?.length || 0) > 0 && (
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs text-app-text-secondary">
                        协作成员
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {localIssue.assignees?.map((assignee) => (
                          <Badge
                            key={assignee.id}
                            variant="secondary"
                            className="bg-app-button-hover text-app-text-primary"
                          >
                            {memberOptions.find(
                              (member) => member.id === assignee.memberId,
                            )?.name || getIssueMemberName(assignee.member)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-t border-app-border pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-app-text-primary">描述</Label>
                    {editingField !== "description" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-md text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
                        onClick={() => handleFieldEdit("description")}
                      >
                        <RiEditLine className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {renderEditingHint("description")}

                  {editingField === "description" ? (
                    <div className="space-y-2">
                      <Textarea
                        value={localIssue.description || ""}
                        onChange={(event) =>
                          setLocalIssue({
                            ...localIssue,
                            description: event.target.value,
                          })
                        }
                        className="min-h-[200px] max-h-[600px] border-app-border bg-app-bg text-app-text-primary"
                        rows={4}
                        placeholder="添加描述..."
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="bg-sky-600 text-white hover:bg-sky-500"
                          onClick={() =>
                            persistIssuePatch({
                              description: localIssue.description,
                            })
                          }
                        >
                          保存
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-app-border bg-transparent text-app-text-primary"
                          onClick={handleCancelEdit}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm text-app-text-secondary">
                      {localIssue.description || "暂无描述"}
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-app-border pt-4 text-xs text-app-text-muted">
                  <div className="flex items-center gap-2">
                    <RiTimeLine className="h-3 w-3" />
                    <span>创建时间: {formatDate(localIssue.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiTimeLine className="h-3 w-3" />
                    <span>更新时间: {formatDate(localIssue.updatedAt)}</span>
                  </div>
                  {updateIssueMutation.isPending && (
                    <div className="text-sky-600">正在保存变更...</div>
                  )}
                </div>
              </div>
            </CardContent>
          </ScrollArea>
        </Card>

        <Card className="flex min-h-0 w-1/3 flex-col overflow-hidden border-app-border bg-app-content-bg shadow-none">
          <CardHeader className="border-b border-app-border p-4">
            <CardTitle className="flex items-center gap-2 text-lg text-app-text-primary">
              <RiFileTextLine className="h-5 w-5" />
              讨论
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-0">
            <DiscussionTab
              issueId={issueId}
              workspaceId={workspaceId}
              members={discussionMembers}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return <div className="h-full w-full overflow-hidden">{content}</div>;
}
