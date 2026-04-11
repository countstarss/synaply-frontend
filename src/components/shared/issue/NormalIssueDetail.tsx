"use client";

import React, { useEffect, useState } from "react";
import {
  RiArrowLeftLine,
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiEditLine,
  RiFileTextLine,
  RiLinkM,
  RiSaveLine,
  RiSparklingLine,
  RiTimeLine,
} from "react-icons/ri";
import { toast } from "sonner";
import { AiThreadShell } from "@/components/ai/thread/AiThreadShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useIssue, useUpdateIssue } from "@/hooks/useIssueApi";
import { useIssueStates } from "@/hooks/useIssueStates";
import { useProjects } from "@/hooks/useProjectApi";
import { useDocsTree } from "@/hooks/useDocApi";
import { useIssueRealtime } from "@/hooks/realtime/useIssueRealtime";
import { useTeamMemberByUserId, useTeamMembers } from "@/hooks/useTeam";
import { useWorkspace } from "@/hooks/useWorkspace";
import DiscussionTab from "@/components/issue/tabs/DiscussionTab";
import { Issue, IssueAssigneeMember } from "@/lib/fetchers/issue";
import type { TeamMember } from "@/lib/fetchers/team";
import type { DocRecord } from "@/lib/fetchers/doc";
import { cn } from "@/lib/utils";
import {
  IssuePriority,
  IssueStateCategory,
  VisibilityType,
} from "@/types/prisma";

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
const EMPTY_STATE_VALUE = "__empty_state__";
const EMPTY_PROJECT_VALUE = "__empty_project__";
const EMPTY_ASSIGNEE_VALUE = "__empty_assignee__";

const DOC_REFERENCE_PATTERN = /\[文档：([^\]]+)\]\(synaply-doc:\/\/([^)]+)\)/g;

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

function getVisibilityLabel(visibility?: VisibilityType | null) {
  return (
    VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.label ||
    "未设置"
  );
}

function extractBlockNoteText(value: unknown): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(extractBlockNoteText).filter(Boolean).join(" ");
  }

  if (typeof value === "object") {
    const record = value as {
      text?: unknown;
      content?: unknown;
      children?: unknown;
    };

    return [
      extractBlockNoteText(record.text),
      extractBlockNoteText(record.content),
      extractBlockNoteText(record.children),
    ]
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

function getDocPreviewContent(doc?: DocRecord | null) {
  if (!doc?.content) {
    return "该文档暂无内容。";
  }

  try {
    const parsed = JSON.parse(doc.content) as unknown;
    const text = extractBlockNoteText(parsed).replace(/\s+/g, " ").trim();

    return text || "该文档暂无内容。";
  } catch {
    return doc.content;
  }
}

function renderInlineMarkdown(
  text: string,
  docsById: Map<string, DocRecord>,
  onOpenDoc: (doc: DocRecord) => void,
  keyPrefix: string,
) {
  const nodes: React.ReactNode[] = [];
  const matcher = /\[文档：([^\]]+)\]\(synaply-doc:\/\/([^)]+)\)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(matcher)) {
    const [raw, title, docId] = match;
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    const doc = docsById.get(docId);
    nodes.push(
      <button
        key={`${keyPrefix}-${docId}-${index}`}
        type="button"
        disabled={!doc}
        onClick={() => doc && onOpenDoc(doc)}
        className="inline-flex items-center gap-1 rounded-md border border-app-border bg-app-content-bg px-2 py-0.5 text-xs font-medium text-sky-700 transition hover:bg-app-button-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RiFileTextLine className="h-3 w-3" />
        {title || doc?.title || "团队文档"}
      </button>,
    );

    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length ? nodes : text;
}

function MarkdownDescriptionPreview({
  content,
  docsById,
  onOpenDoc,
}: {
  content?: string | null;
  docsById: Map<string, DocRecord>;
  onOpenDoc: (doc: DocRecord) => void;
}) {
  if (!content?.trim()) {
    return (
      <div className="rounded-lg border border-dashed border-app-border px-4 py-8 text-center text-sm text-app-text-muted">
        暂无描述。可以补充背景、验收标准、风险和相关文档。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-sm leading-6 text-app-text-secondary">
      {content.split("\n").map((line, index) => {
        const trimmed = line.trim();
        const inline = renderInlineMarkdown(
          trimmed,
          docsById,
          onOpenDoc,
          `line-${index}`,
        );

        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }

        if (trimmed.startsWith("### ")) {
          return (
            <h4
              key={index}
              className="text-base font-semibold text-app-text-primary"
            >
              {renderInlineMarkdown(
                trimmed.slice(4),
                docsById,
                onOpenDoc,
                `heading-${index}`,
              )}
            </h4>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h3
              key={index}
              className="text-lg font-semibold text-app-text-primary"
            >
              {renderInlineMarkdown(
                trimmed.slice(3),
                docsById,
                onOpenDoc,
                `heading-${index}`,
              )}
            </h3>
          );
        }

        if (trimmed.startsWith("# ")) {
          return (
            <h2
              key={index}
              className="text-xl font-semibold text-app-text-primary"
            >
              {renderInlineMarkdown(
                trimmed.slice(2),
                docsById,
                onOpenDoc,
                `heading-${index}`,
              )}
            </h2>
          );
        }

        if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("- [x] ")) {
          return (
            <div key={index} className="flex items-start gap-2">
              <span className="mt-1.5 h-3 w-3 rounded border border-app-border" />
              <span>
                {renderInlineMarkdown(
                  trimmed.slice(6),
                  docsById,
                  onOpenDoc,
                  `todo-${index}`,
                )}
              </span>
            </div>
          );
        }

        if (trimmed.startsWith("- ")) {
          return (
            <div key={index} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-app-text-muted" />
              <span>
                {renderInlineMarkdown(
                  trimmed.slice(2),
                  docsById,
                  onOpenDoc,
                  `list-${index}`,
                )}
              </span>
            </div>
          );
        }

        if (trimmed.startsWith("> ")) {
          return (
            <blockquote
              key={index}
              className="border-l-2 border-app-border pl-3 text-app-text-muted"
            >
              {renderInlineMarkdown(
                trimmed.slice(2),
                docsById,
                onOpenDoc,
                `quote-${index}`,
              )}
            </blockquote>
          );
        }

        return <p key={index}>{inline}</p>;
      })}
    </div>
  );
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
  const { data: issue, isLoading: isLoadingIssue } = useIssue(
    workspaceId,
    issueId,
    {
      enabled: isOpen,
    },
  );
  const { currentWorkspace } = useWorkspace();
  const workspaceType = currentWorkspace?.type || "PERSONAL";
  const teamId = currentWorkspace?.teamId;
  const currentUserName =
    user?.user_metadata?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "匿名用户";
  const { getEditorsForField, setEditingField: setRealtimeEditingField } =
    useIssueRealtime(issueId, workspaceId, {
      enabled: isOpen,
    });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [committedIssue, setCommittedIssue] = useState<Issue | null>(
    issue ?? null,
  );
  const [localIssue, setLocalIssue] = useState<Issue | null>(issue ?? null);
  const [isDocPickerOpen, setIsDocPickerOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocRecord | null>(null);
  const [isAiThreadOpen, setIsAiThreadOpen] = useState(false);

  const { data: projects = [] } = useProjects(workspaceId);
  const { data: issueStates = [] } = useIssueStates(workspaceId, {
    enabled: isOpen,
  });
  const { data: teamMembers = [] } = useTeamMembers(teamId);
  const { data: currentUserTeamMember } = useTeamMemberByUserId(user?.id);
  const docsContext = workspaceType === "TEAM" ? "team" : "personal";
  const { data: workspaceDocs = [], isLoading: isLoadingDocs } = useDocsTree(
    workspaceId,
    {
      context: docsContext,
      workspaceType: workspaceType === "TEAM" ? "TEAM" : "PERSONAL",
      includeArchived: false,
    },
    { enabled: isOpen && !!workspaceId },
  );
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
  const currentWorkspaceMember = teamMembers.find(
    (member) => member.user.id === user?.id,
  );
  const currentMemberId =
    currentWorkspaceMember?.id || currentUserTeamMember?.id;
  const canEditIssue = Boolean(
    localIssue &&
      user?.id &&
      (workspaceType === "PERSONAL" ||
        currentWorkspaceMember?.role === "OWNER" ||
        currentWorkspaceMember?.role === "ADMIN" ||
        localIssue.creatorId === user.id ||
        localIssue.creatorMemberId === currentMemberId ||
        localIssue.directAssigneeId === currentMemberId ||
        localIssue.assignees?.some(
          (assignee) =>
            assignee.memberId === currentMemberId ||
            assignee.member?.user?.id === user.id,
        )),
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
  }, [
    currentUserName,
    currentUserTeamMember?.id,
    memberOptions,
    user?.email,
    user?.user_metadata?.avatar_url,
  ]);
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
  const directAssignee =
    memberOptions.find(
      (member) => member.id === localIssue?.directAssigneeId,
    ) || personalDirectAssignee;
  const selectedProject = projects.find(
    (project) => project.id === localIssue?.projectId,
  );
  const selectedState = issueStates.find(
    (state) => state.id === localIssue?.stateId,
  );
  const currentPriority = getPriorityOption(localIssue?.priority);
  const doneState =
    issueStates.find(
      (state) => state.category === IssueStateCategory.DONE && state.isDefault,
    ) ||
    issueStates.find((state) => state.category === IssueStateCategory.DONE) ||
    null;
  const isIssueDone = selectedState?.category === IssueStateCategory.DONE;
  const canQuickComplete = Boolean(
    canEditIssue &&
      doneState &&
      !isIssueDone &&
      (workspaceType === "PERSONAL" ||
        currentWorkspaceMember?.role === "OWNER" ||
        currentWorkspaceMember?.role === "ADMIN" ||
        localIssue?.directAssigneeId === currentMemberId),
  );
  const dueDateValue = localIssue?.dueDate
    ? new Date(localIssue.dueDate ?? "")
    : undefined;
  const documentOptions = React.useMemo(
    () => workspaceDocs.filter((doc) => doc.type === "document"),
    [workspaceDocs],
  );
  const docsById = React.useMemo(
    () => new Map(documentOptions.map((doc) => [doc._id, doc])),
    [documentOptions],
  );
  const referencedDocCount = React.useMemo(
    () =>
      Array.from(
        (localIssue?.description || "").matchAll(DOC_REFERENCE_PATTERN),
      ).length,
    [localIssue?.description],
  );

  useEffect(() => {
    if (issue) {
      setCommittedIssue(issue);
      setLocalIssue((current) => (editingField ? (current ?? issue) : issue));
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
      toast.error("当前工作空间无效，无法保存任务");
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
      toast.success("任务已保存");
    } catch (error) {
      console.error("更新任务失败:", error);
      toast.error(
        error instanceof Error ? error.message : "更新任务失败，请重试",
      );
    }
  };

  const renderEditingHint = (
    field:
      | "title"
      | "state"
      | "priority"
      | "assignee"
      | "dueDate"
      | "description",
  ) => {
    const editors = getEditorsForField(field);

    if (editors.length === 0) {
      return null;
    }

    return (
      <div className="text-xs text-amber-600">
        {editors.map((participant) => participant.name).join("、")}{" "}
        正在编辑该字段
      </div>
    );
  };

  const handleInsertDocReference = (doc: DocRecord) => {
    if (!localIssue) {
      return;
    }

    const safeTitle = doc.title.replace(/[\[\]]/g, "");
    const reference = `[文档：${safeTitle}](synaply-doc://${doc._id})`;
    const currentDescription = localIssue.description?.trimEnd() || "";
    const nextDescription = currentDescription
      ? `${currentDescription}\n\n${reference}`
      : reference;

    setLocalIssue({
      ...localIssue,
      description: nextDescription,
    });
    setEditingField("description");
    setIsDocPickerOpen(false);
  };

  const handleQuickComplete = () => {
    if (!doneState) {
      toast.error("当前工作空间还没有可用的完成状态");
      return;
    }

    void persistIssuePatch({ stateId: doneState.id }, { state: doneState });
  };

  if (!isOpen) {
    return null;
  }

  if (isLoadingIssue || !localIssue || !committedIssue) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-lg border border-app-border bg-app-content-bg text-app-text-muted">
        <div>{isLoadingIssue ? "正在加载任务..." : "任务不存在或已被删除"}</div>
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
          <div className="min-w-0 flex-1 space-y-3">
            {editingField === "title" ? (
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={localIssue.title}
                  onChange={(event) =>
                    setLocalIssue({ ...localIssue, title: event.target.value })
                  }
                  className="flex-1 border-app-border bg-app-bg text-app-text-primary"
                  autoFocus
                />
                <Button
                  type="button"
                  className="bg-sky-600 text-white hover:bg-sky-500"
                  onClick={() => persistIssuePatch({ title: localIssue.title })}
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
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <CardTitle className="min-w-0 truncate text-xl text-app-text-primary">
                  {localIssue.title}
                </CardTitle>
                {canEditIssue && (
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
            )}
            {renderEditingHint("title")}

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-app-border text-app-text-primary"
              >
                {localIssue.key || `#${localIssue.id}`}
              </Badge>

              {canEditIssue ? (
                <Select
                  value={localIssue.stateId ?? EMPTY_STATE_VALUE}
                  onValueChange={(value) => {
                    const nextState =
                      value === EMPTY_STATE_VALUE
                        ? null
                        : issueStates.find((state) => state.id === value) ||
                          null;
                    void persistIssuePatch(
                      { stateId: nextState?.id ?? null },
                      { state: nextState },
                    );
                  }}
                >
                  <SelectTrigger className="h-8 w-auto min-w-[108px] rounded-md border-app-border bg-app-content-bg text-app-text-primary">
                    <SelectValue placeholder="状态：未设置" />
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    <SelectGroup>
                      <SelectItem value={EMPTY_STATE_VALUE}>
                        状态：未设置
                      </SelectItem>
                      {issueStates.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          状态：{state.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-app-button-hover text-app-text-primary"
                >
                  状态：{selectedState?.name || "未设置"}
                </Badge>
              )}

              {canEditIssue ? (
                <Select
                  value={localIssue.priority ?? EMPTY_PRIORITY_VALUE}
                  onValueChange={(value) =>
                    void persistIssuePatch({
                      priority:
                        value === EMPTY_PRIORITY_VALUE
                          ? null
                          : (value as IssuePriority),
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-auto min-w-[100px] rounded-md border-app-border bg-app-content-bg text-app-text-primary">
                    <SelectValue placeholder="优先级：未设置" />
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    <SelectGroup>
                      <SelectItem value={EMPTY_PRIORITY_VALUE}>
                        优先级：未设置
                      </SelectItem>
                      {PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          优先级：{option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className={cn("border-transparent", currentPriority?.color)}
                >
                  优先级：{currentPriority?.label || "未设置"}
                </Badge>
              )}

              {canEditIssue ? (
                <Select
                  value={localIssue.projectId ?? EMPTY_PROJECT_VALUE}
                  onValueChange={(value) => {
                    const nextProjectId =
                      value === EMPTY_PROJECT_VALUE ? null : value;
                    const nextProject =
                      projects.find(
                        (project) => project.id === nextProjectId,
                      ) || null;
                    void persistIssuePatch(
                      { projectId: nextProjectId },
                      { project: nextProject },
                    );
                  }}
                >
                  <SelectTrigger className="h-8 w-auto min-w-[120px] rounded-md border-app-border bg-app-content-bg text-app-text-primary">
                    <SelectValue placeholder="项目：未设置" />
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    <SelectGroup>
                      <SelectItem value={EMPTY_PROJECT_VALUE}>
                        项目：未设置
                      </SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          项目：{project.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className="border-app-border text-app-text-primary"
                >
                  项目：
                  {selectedProject?.name ||
                    localIssue.project?.name ||
                    "未设置"}
                </Badge>
              )}

              {canEditIssue && workspaceType !== "PERSONAL" ? (
                <Select
                  value={localIssue.directAssigneeId ?? EMPTY_ASSIGNEE_VALUE}
                  onValueChange={(value) =>
                    void persistIssuePatch({
                      directAssigneeId:
                        value === EMPTY_ASSIGNEE_VALUE ? null : value,
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-auto min-w-[130px] rounded-md border-app-border bg-app-content-bg text-app-text-primary">
                    <SelectValue placeholder="负责人：未分配" />
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    <SelectGroup>
                      <SelectItem value={EMPTY_ASSIGNEE_VALUE}>
                        负责人：未分配
                      </SelectItem>
                      {memberOptions.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          负责人：{member.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className="border-app-border text-app-text-primary"
                >
                  负责人：{directAssignee?.name || currentUserName || "未分配"}
                </Badge>
              )}

              {canEditIssue ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-app-border bg-app-content-bg text-app-text-primary"
                    >
                      <RiCalendarLine className="h-3 w-3" />
                      截止：{formatDateOnly(localIssue.dueDate)}
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
                        void persistIssuePatch({
                          dueDate: date ? toUtcMidnightIso(date) : null,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <Badge
                  variant="outline"
                  className="border-app-border text-app-text-primary"
                >
                  截止：{formatDateOnly(localIssue.dueDate)}
                </Badge>
              )}

              {canEditIssue ? (
                <Select
                  value={localIssue.visibility ?? VisibilityType.PRIVATE}
                  onValueChange={(value) =>
                    void persistIssuePatch({
                      visibility: value as VisibilityType,
                    })
                  }
                >
                  <SelectTrigger className="h-8 w-auto min-w-[130px] rounded-md border-app-border bg-app-content-bg text-app-text-primary">
                    <SelectValue placeholder="可见性" />
                  </SelectTrigger>
                  <SelectContent className="border-app-border bg-app-content-bg">
                    <SelectGroup>
                      {VISIBILITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          可见性：{option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <Badge
                  variant="outline"
                  className="border-app-border text-app-text-primary"
                >
                  可见性：{getVisibilityLabel(localIssue.visibility)}
                </Badge>
              )}

              {localIssue.assignees?.map((assignee) => (
                <Badge
                  key={assignee.id}
                  variant="secondary"
                  className="bg-app-button-hover text-app-text-primary"
                >
                  协作：
                  {memberOptions.find(
                    (member) => member.id === assignee.memberId,
                  )?.name || getIssueMemberName(assignee.member)}
                </Badge>
              ))}
            </div>

            {canEditIssue && canQuickComplete && (
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-500"
                disabled={updateIssueMutation.isPending}
                onClick={handleQuickComplete}
              >
                <RiCheckLine className="h-4 w-4" />
                标记为完成
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-app-border bg-transparent text-app-text-primary"
              onClick={() => setIsAiThreadOpen(true)}
            >
              <RiSparklingLine className="h-4 w-4 text-sky-600" />
              打开 AI 助手
            </Button>
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

      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="flex min-h-0 flex-col overflow-hidden border-app-border bg-app-content-bg shadow-none">
          <CardHeader className="flex flex-col gap-3 border-b border-app-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg text-app-text-primary">
                任务描述
              </CardTitle>
              <p className="text-xs text-app-text-muted">
                {referencedDocCount > 0
                  ? ` 已引用 ${referencedDocCount} 篇文档。`
                  : ""}
              </p>
            </div>
            {canEditIssue && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-app-border bg-transparent text-app-text-primary"
                  onClick={() => setIsDocPickerOpen(true)}
                >
                  <RiLinkM className="h-4 w-4" />
                  引入团队文档
                </Button>
                {editingField === "description" ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-sky-600 text-white hover:bg-sky-500"
                      onClick={() =>
                        persistIssuePatch({
                          description: localIssue.description,
                        })
                      }
                    >
                      保存描述
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-app-border bg-transparent text-app-text-primary"
                      onClick={handleCancelEdit}
                    >
                      取消
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-app-border bg-transparent text-app-text-primary"
                    onClick={() => handleFieldEdit("description")}
                  >
                    <RiEditLine className="h-4 w-4" />
                    编辑描述
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <ScrollArea className="min-h-0 flex-1 overflow-hidden">
            <CardContent className="flex flex-col gap-4 p-4">
              {renderEditingHint("description")}
              {editingField === "description" ? (
                <Textarea
                  value={localIssue.description || ""}
                  onChange={(event) =>
                    setLocalIssue({
                      ...localIssue,
                      description: event.target.value,
                    })
                  }
                  className="min-h-[360px] resize-none border-app-border bg-app-bg text-app-text-primary"
                  placeholder={
                    "用 Markdown 写清背景、验收标准、风险和下一步。\n例如：\n## 背景\n- 为什么要做\n- [ ] 待确认事项"
                  }
                />
              ) : (
                <MarkdownDescriptionPreview
                  content={localIssue.description}
                  docsById={docsById}
                  onOpenDoc={setPreviewDoc}
                />
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        <Card className="flex min-h-[320px] flex-col overflow-hidden border-app-border bg-app-content-bg shadow-none xl:min-h-0">
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

      <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 rounded-lg border border-app-border bg-app-content-bg px-4 py-2 text-xs text-app-text-muted">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1">
            <RiTimeLine className="h-3 w-3" />
            创建时间：{formatDate(localIssue.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <RiTimeLine className="h-3 w-3" />
            更新时间：{formatDate(localIssue.updatedAt)}
          </span>
        </div>
        {updateIssueMutation.isPending && (
          <span className="text-sky-600">正在保存变更...</span>
        )}
      </div>

      <Dialog open={isDocPickerOpen} onOpenChange={setIsDocPickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>引入团队文档</DialogTitle>
            <DialogDescription>
              选择一篇文档插入到任务描述中，之后点击描述里的文档标签即可查看内容。
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[420px] overflow-y-auto rounded-lg border border-app-border">
            {isLoadingDocs ? (
              <div className="p-4 text-sm text-app-text-muted">
                正在加载团队文档...
              </div>
            ) : documentOptions.length === 0 ? (
              <div className="p-4 text-sm text-app-text-muted">
                暂无可引用的团队文档。
              </div>
            ) : (
              documentOptions.map((doc) => (
                <button
                  key={doc._id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 border-b border-app-border px-4 py-3 text-left last:border-b-0 hover:bg-app-button-hover"
                  onClick={() => handleInsertDocReference(doc)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-app-text-primary">
                      {doc.title}
                    </span>
                    <span className="mt-1 block text-xs text-app-text-muted">
                      {doc.projectId ? "项目文档" : "团队文档"}
                    </span>
                  </span>
                  <RiFileTextLine className="h-4 w-4 text-app-text-secondary" />
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDocPickerOpen(false)}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(previewDoc)}
        onOpenChange={(open) => {
          if (!open) setPreviewDoc(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewDoc?.title || "团队文档"}</DialogTitle>
            <DialogDescription>来自团队空间的引用文档预览。</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[520px] rounded-lg border border-app-border bg-app-bg">
            <div className="whitespace-pre-wrap p-4 text-sm leading-6 text-app-text-secondary">
              {getDocPreviewContent(previewDoc)}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AiThreadShell
        open={isAiThreadOpen}
        onOpenChange={setIsAiThreadOpen}
        workspaceId={workspaceId}
        originSurfaceType="ISSUE"
        originSurfaceId={issueId}
        originTitle={localIssue?.title}
      />
    </div>
  );

  return <div className="h-full w-full overflow-hidden">{content}</div>;
}
