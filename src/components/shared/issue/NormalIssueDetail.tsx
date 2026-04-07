"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  RiAtLine,
  RiCalendarLine,
  RiCloseLine,
  RiEditLine,
  RiFileTextLine,
  RiPriceTagLine,
  RiSaveLine,
  RiSendPlaneLine,
  RiTimeLine,
} from "react-icons/ri";
import { useAuth } from "@/context/AuthContext";
import { useUpdateIssue } from "@/hooks/useIssueApi";
import { useIssueStates } from "@/hooks/useIssueStates";
import { useProjects } from "@/hooks/useProjectApi";
import { useTeamMemberByUserId, useTeamMembers } from "@/hooks/useTeam";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Issue, IssueAssigneeMember } from "@/lib/fetchers/issue";
import type { TeamMember } from "@/lib/fetchers/team";
import { IssuePriority, VisibilityType } from "@/types/prisma";

interface NormalIssueDetailProps {
  issue: Issue;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedIssue: Issue) => void;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  mentions: string[];
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

function getCommentAuthorName(author?: string | null) {
  return author?.trim() || "匿名用户";
}

function getAvatarFallback(value?: string | null) {
  return value?.trim()?.[0] || "?";
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

function getPriorityOption(priority?: IssuePriority | null) {
  return PRIORITY_OPTIONS.find((option) => option.value === priority) || null;
}

function buildInitialComments(
  currentUserName: string,
  currentUserAvatar?: string,
): Comment[] {
  return [
    {
      id: "1",
      content: "这里可以继续补充处理思路、同步上下文或给协作者留言。",
      author: currentUserName,
      authorAvatar: currentUserAvatar,
      createdAt: new Date().toISOString(),
      mentions: [],
    },
  ];
}

// TO AGENTS: 不要破坏这个组件的整体布局和样式, 增减一些内容或者字段是 OK 的。
export default function NormalIssueDetail({
  issue,
  isOpen,
  onClose,
  onUpdate,
}: NormalIssueDetailProps) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const workspaceType = currentWorkspace?.type || "PERSONAL";
  const teamId = currentWorkspace?.teamId;
  const currentUserName =
    user?.user_metadata?.name?.trim() || user?.email?.split("@")[0] || "匿名用户";
  const currentUserAvatar = user?.user_metadata?.avatar_url || undefined;

  const [editingField, setEditingField] = useState<string | null>(null);
  const [committedIssue, setCommittedIssue] = useState<Issue>(issue);
  const [localIssue, setLocalIssue] = useState<Issue>(issue);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>(
    buildInitialComments(currentUserName, currentUserAvatar),
  );
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

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

  for (const assignee of localIssue.assignees || []) {
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
  const personalDirectAssignee =
    workspaceType === "PERSONAL" &&
    localIssue.directAssigneeId &&
    currentUserTeamMember?.id === localIssue.directAssigneeId
      ? {
          id: currentUserTeamMember.id,
          name: currentUserName,
          email: user?.email || "",
        }
      : null;
  const directAssignee = memberOptions.find(
    (member) => member.id === localIssue.directAssigneeId,
  ) || personalDirectAssignee;
  const selectedProject = projects.find(
    (project) => project.id === localIssue.projectId,
  );
  const selectedState = issueStates.find((state) => state.id === localIssue.stateId);

  useEffect(() => {
    setCommittedIssue(issue);
    setLocalIssue(issue);
    setEditingField(null);
  }, [issue]);

  useEffect(() => {
    setComments(buildInitialComments(currentUserName, currentUserAvatar));
    setCommentText("");
    setShowMentionList(false);
    setMentionQuery("");
  }, [currentUserAvatar, currentUserName, issue.id]);

  const handleFieldEdit = (field: string) => {
    setEditingField(field);
  };

  const handleCancelEdit = () => {
    setLocalIssue(committedIssue);
    setEditingField(null);
  };

  const handleCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    const nextCursorPosition = event.target.selectionStart;

    setCommentText(value);
    setCursorPosition(nextCursorPosition);

    const atIndex = value.lastIndexOf("@", nextCursorPosition);
    if (atIndex !== -1 && (atIndex === 0 || value[atIndex - 1] === " ")) {
      const query = value.substring(atIndex + 1, nextCursorPosition);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentionList(true);
        return;
      }
    }

    setShowMentionList(false);
  };

  const handleMentionSelect = (member: MemberOption) => {
    const atIndex = commentText.lastIndexOf("@", cursorPosition);
    const beforeAt = commentText.substring(0, atIndex);
    const afterCursor = commentText.substring(cursorPosition);
    const nextText = `${beforeAt}@${member.name} ${afterCursor}`;

    setCommentText(nextText);
    setShowMentionList(false);
    setMentionQuery("");

    setTimeout(() => {
      if (!commentInputRef.current) {
        return;
      }

      const nextCursorPosition = atIndex + member.name.length + 2;
      commentInputRef.current.focus();
      commentInputRef.current.setSelectionRange(
        nextCursorPosition,
        nextCursorPosition,
      );
    }, 0);
  };

  const handleSendComment = () => {
    if (!commentText.trim()) {
      return;
    }

    const mentions =
      commentText.match(/@([^\s]+)/g)?.map((mention) => mention.substring(1)) ||
      [];

    const nextComment: Comment = {
      id: Date.now().toString(),
      content: commentText,
      author: currentUserName,
      authorAvatar: currentUserAvatar,
      createdAt: new Date().toISOString(),
      mentions,
    };

    setComments((previousComments) => [...previousComments, nextComment]);
    setCommentText("");
    setShowMentionList(false);
  };

  const filteredMembers = memberOptions.filter((member) =>
    member.name.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  const persistIssuePatch = async (
    patch: Partial<Issue>,
    relationOverrides: Partial<Issue> = {},
  ) => {
    if (!workspaceId) {
      alert("当前工作空间无效，无法保存 Issue");
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
    } catch (error) {
      console.error("更新 Issue 失败:", error);
      alert(error instanceof Error ? error.message : "更新 Issue 失败，请重试");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex w-full items-center justify-center bg-white/80 dark:bg-black/50">
      <div className="relative h-[calc(100vh-64px)] w-full max-w-screen overflow-hidden rounded-lg bg-app-bg shadow-xl">
        <div className="h-full p-2">
          <div className="flex h-full flex-col gap-2">
            <div className="flex-shrink-0 rounded-lg border border-app-border bg-app-content-bg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="mb-2 text-xl font-semibold text-app-text-primary">
                    {localIssue.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-app-text-muted">
                    <span>{localIssue.key || `#${localIssue.id}`}</span>
                    {selectedState && (
                      <span className="rounded-full bg-app-button-hover px-2 py-1 text-xs">
                        {selectedState.name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 transition-colors hover:bg-app-button-hover"
                >
                  <RiCloseLine className="h-5 w-5 text-app-text-secondary" />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 gap-2">
              <div className="flex w-2/3 flex-col rounded-lg border border-app-border bg-app-content-bg">
                <div className="flex-shrink-0 border-b border-app-border p-4">
                  <h3 className="text-lg font-semibold text-app-text-primary">
                    Issue 详情
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-col gap-6">
                    <div className="space-y-6">
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-sm font-medium text-app-text-primary">
                            标题
                          </label>
                          {editingField !== "title" && (
                            <button
                              onClick={() => handleFieldEdit("title")}
                              className="rounded p-1 hover:bg-app-button-hover"
                            >
                              <RiEditLine className="h-4 w-4 text-app-text-secondary" />
                            </button>
                          )}
                        </div>
                        {editingField === "title" ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={localIssue.title}
                              onChange={(event) =>
                                setLocalIssue({
                                  ...localIssue,
                                  title: event.target.value,
                                })
                              }
                              className="flex-1 rounded-md border border-app-border bg-app-bg px-3 py-2 text-app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() =>
                                persistIssuePatch({ title: localIssue.title })
                              }
                              className="rounded-md bg-blue-600 px-3 py-2 text-white transition-colors hover:bg-blue-700"
                            >
                              <RiSaveLine className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="rounded-md border border-app-border px-3 py-2 transition-colors hover:bg-app-button-hover"
                            >
                              <RiCloseLine className="h-4 w-4 text-app-text-secondary" />
                            </button>
                          </div>
                        ) : (
                          <h3 className="text-lg font-medium text-app-text-primary">
                            {localIssue.title}
                          </h3>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="border-b border-app-border pb-2 text-sm font-medium text-app-text-primary">
                        Issue 属性
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-app-text-secondary">
                            状态
                          </label>
                          {editingField === "stateId" ? (
                            <div className="flex gap-2">
                              <select
                                value={localIssue.stateId || ""}
                                onChange={(event) => {
                                  const nextStateId = event.target.value;
                                  const nextState = issueStates.find(
                                    (state) => state.id === nextStateId,
                                  );

                                  setLocalIssue({
                                    ...localIssue,
                                    stateId: nextStateId || null,
                                    state: nextState || null,
                                  });
                                }}
                                className="w-full rounded bg-app-bg px-2 py-1 text-sm text-app-text-primary ring-1 ring-app-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              >
                                {issueStates.map((state) => (
                                  <option key={state.id} value={state.id}>
                                    {state.name} ({state.category})
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() =>
                                  persistIssuePatch(
                                    { stateId: localIssue.stateId || undefined },
                                    { state: localIssue.state || null },
                                  )
                                }
                                className="rounded bg-blue-600 px-2 text-white transition-colors hover:bg-blue-700"
                              >
                                <RiSaveLine className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleFieldEdit("stateId")}
                              className="w-full rounded px-2 py-1 text-left text-sm text-app-text-primary transition-colors hover:bg-app-button-hover"
                            >
                              {localIssue.state?.name || "未设置"}
                              {localIssue.state?.category
                                ? ` · ${localIssue.state.category}`
                                : ""}
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-app-text-secondary">
                            优先级
                          </label>
                          {editingField === "priority" ? (
                            <div className="flex gap-2">
                              <select
                                value={localIssue.priority || ""}
                                onChange={(event) =>
                                  setLocalIssue({
                                    ...localIssue,
                                    priority:
                                      (event.target.value as IssuePriority) ||
                                      undefined,
                                  })
                                }
                                className="w-full rounded bg-app-bg px-2 py-1 text-sm text-app-text-primary ring-1 ring-app-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              >
                                <option value="">未设置</option>
                                {PRIORITY_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() =>
                                  persistIssuePatch({
                                    priority: localIssue.priority,
                                  })
                                }
                                className="rounded bg-blue-600 px-2 text-white transition-colors hover:bg-blue-700"
                              >
                                <RiSaveLine className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleFieldEdit("priority")}
                              className="w-full rounded px-2 py-1 text-left text-sm text-app-text-primary transition-colors hover:bg-app-button-hover"
                            >
                              {getPriorityOption(localIssue.priority)?.label || "未设置"}
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-app-text-secondary">
                            <RiPriceTagLine className="h-3 w-3" />
                            项目
                          </label>
                          {editingField === "projectId" ? (
                            <div className="flex gap-2">
                              <select
                                value={localIssue.projectId || ""}
                                onChange={(event) => {
                                  const nextProjectId = event.target.value;
                                  const nextProject = projects.find(
                                    (project) => project.id === nextProjectId,
                                  );

                                  setLocalIssue({
                                    ...localIssue,
                                    projectId: nextProjectId || null,
                                    project: nextProject || null,
                                  });
                                }}
                                className="w-full rounded bg-app-bg px-2 py-1 text-sm text-app-text-primary ring-1 ring-app-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              >
                                <option value="">不归属任何项目</option>
                                {projects.map((project) => (
                                  <option key={project.id} value={project.id}>
                                    {project.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() =>
                                  persistIssuePatch(
                                    { projectId: localIssue.projectId ?? null },
                                    { project: localIssue.project || null },
                                  )
                                }
                                className="rounded bg-blue-600 px-2 text-white transition-colors hover:bg-blue-700"
                              >
                                <RiSaveLine className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleFieldEdit("projectId")}
                              className="w-full rounded px-2 py-1 text-left text-sm text-app-text-primary transition-colors hover:bg-app-button-hover"
                            >
                              {selectedProject?.name || localIssue.project?.name || "未设置"}
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-app-text-secondary">
                            可见性
                          </label>
                          {editingField === "visibility" ? (
                            <div className="flex gap-2">
                              <select
                                value={localIssue.visibility || ""}
                                onChange={(event) =>
                                  setLocalIssue({
                                    ...localIssue,
                                    visibility:
                                      (event.target.value as VisibilityType) ||
                                      undefined,
                                  })
                                }
                                className="w-full rounded bg-app-bg px-2 py-1 text-sm text-app-text-primary ring-1 ring-app-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              >
                                {VISIBILITY_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() =>
                                  persistIssuePatch({
                                    visibility: localIssue.visibility,
                                  })
                                }
                                className="rounded bg-blue-600 px-2 text-white transition-colors hover:bg-blue-700"
                              >
                                <RiSaveLine className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleFieldEdit("visibility")}
                              className="w-full rounded px-2 py-1 text-left text-sm text-app-text-primary transition-colors hover:bg-app-button-hover"
                            >
                              {VISIBILITY_OPTIONS.find(
                                (option) => option.value === localIssue.visibility,
                              )?.label || "未设置"}
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-app-text-secondary">
                            主负责人
                          </label>
                          {workspaceType === "PERSONAL" ? (
                            <div className="w-full rounded px-2 py-1 text-left text-sm text-app-text-primary">
                              {directAssignee?.name || currentUserName}
                            </div>
                          ) : editingField === "directAssigneeId" ? (
                            <div className="flex gap-2">
                              <select
                                value={localIssue.directAssigneeId || ""}
                                onChange={(event) =>
                                  setLocalIssue({
                                    ...localIssue,
                                    directAssigneeId: event.target.value || null,
                                  })
                                }
                                className="w-full rounded bg-app-bg px-2 py-1 text-sm text-app-text-primary ring-1 ring-app-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              >
                                <option value="">暂不指定负责人</option>
                                {memberOptions.map((member) => (
                                  <option key={member.id} value={member.id}>
                                    {member.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() =>
                                  persistIssuePatch({
                                    directAssigneeId:
                                      localIssue.directAssigneeId ?? null,
                                  })
                                }
                                className="rounded bg-blue-600 px-2 text-white transition-colors hover:bg-blue-700"
                              >
                                <RiSaveLine className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleFieldEdit("directAssigneeId")}
                              className="w-full rounded px-2 py-1 text-left text-sm text-app-text-primary transition-colors hover:bg-app-button-hover"
                            >
                              {directAssignee?.name || "未分配"}
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-app-text-secondary">
                            <RiCalendarLine className="h-3 w-3" />
                            截止日期
                          </label>
                          {editingField === "dueDate" ? (
                            <div className="flex gap-2">
                              <input
                                type="date"
                                value={
                                  localIssue.dueDate
                                    ? new Date(localIssue.dueDate)
                                        .toISOString()
                                        .slice(0, 10)
                                    : ""
                                }
                                onChange={(event) =>
                                  setLocalIssue({
                                    ...localIssue,
                                    dueDate: event.target.value
                                      ? `${event.target.value}T00:00:00.000Z`
                                      : null,
                                  })
                                }
                                className="w-full rounded bg-app-bg px-2 py-1 text-sm text-app-text-primary ring-1 ring-app-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <button
                                onClick={() =>
                                  persistIssuePatch({
                                    dueDate: localIssue.dueDate ?? null,
                                  })
                                }
                                className="rounded bg-blue-600 px-2 text-white transition-colors hover:bg-blue-700"
                              >
                                <RiSaveLine className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleFieldEdit("dueDate")}
                              className="w-full rounded px-2 py-1 text-left text-sm text-app-text-primary transition-colors hover:bg-app-button-hover"
                            >
                              {formatDateOnly(localIssue.dueDate)}
                            </button>
                          )}
                        </div>

                        {(localIssue.assignees?.length || 0) > 0 && (
                          <div className="col-span-2">
                            <label className="mb-1 block text-xs font-medium text-app-text-secondary">
                              协作成员
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {localIssue.assignees?.map((assignee) => (
                                <span
                                  key={assignee.id}
                                  className="rounded-full bg-app-button-hover px-3 py-1 text-xs text-app-text-primary"
                                >
                                  {memberOptions.find(
                                    (member) => member.id === assignee.memberId,
                                  )?.name || getIssueMemberName(assignee.member)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-app-border p-2">
                        <div className="mb-2 flex items-center justify-between">
                          <label className="text-sm font-medium text-app-text-primary">
                            描述
                          </label>
                          {editingField !== "description" && (
                            <button
                              onClick={() => handleFieldEdit("description")}
                              className="rounded p-1 hover:bg-app-button-hover"
                            >
                              <RiEditLine className="h-4 w-4 text-app-text-secondary" />
                            </button>
                          )}
                        </div>
                        {editingField === "description" ? (
                          <div className="space-y-2">
                            <textarea
                              value={localIssue.description || ""}
                              onChange={(event) =>
                                setLocalIssue({
                                  ...localIssue,
                                  description: event.target.value,
                                })
                              }
                              className="min-h-[200px] max-h-[600px] w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={4}
                              placeholder="添加描述..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  persistIssuePatch({
                                    description: localIssue.description,
                                  })
                                }
                                className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700"
                              >
                                保存
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="rounded border border-app-border px-3 py-1 text-sm transition-colors hover:bg-app-button-hover"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap text-app-text-secondary">
                            {localIssue.description || "暂无描述"}
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-4">
                        <div className="space-y-2 text-xs text-app-text-muted">
                          <div className="flex items-center gap-1">
                            <RiTimeLine className="h-3 w-3" />
                            <span>创建时间: {formatDate(localIssue.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <RiTimeLine className="h-3 w-3" />
                            <span>更新时间: {formatDate(localIssue.updatedAt)}</span>
                          </div>
                          {updateIssueMutation.isPending && (
                            <div className="text-blue-600">正在保存变更...</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex w-1/3 flex-col rounded-lg border border-app-border bg-app-content-bg">
                <div className="flex-shrink-0 border-b border-app-border p-4">
                  <h4 className="flex items-center gap-2 text-lg font-semibold text-app-text-primary">
                    <RiFileTextLine className="h-5 w-5" />
                    讨论 ({comments.length})
                  </h4>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="mb-4 space-y-4">
                    {comments.map((comment) => {
                      const authorName = getCommentAuthorName(comment.author);

                      return (
                        <div key={comment.id} className="flex gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm text-white">
                            {comment.authorAvatar ? (
                              <img
                                src={comment.authorAvatar}
                                alt="avatar"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm">
                                {getAvatarFallback(authorName)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-sm font-medium text-app-text-primary">
                                {authorName}
                              </span>
                              <span className="text-xs text-app-text-muted">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <div className="text-sm text-app-text-secondary">
                              {comment.content
                                .split(/(@[^\s]+)/)
                                .map((part, index) => (
                                  <span
                                    key={index}
                                    className={
                                      part.startsWith("@")
                                        ? "font-medium text-blue-600"
                                        : ""
                                    }
                                  >
                                    {part}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-app-border p-4">
                  <div className="relative">
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-400 to-blue-500 text-sm text-white">
                        {currentUserAvatar ? (
                          <img
                            src={currentUserAvatar}
                            alt="avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm">
                            {getAvatarFallback(currentUserName)}
                          </span>
                        )}
                      </div>

                      <div className="relative flex-1">
                        <textarea
                          ref={commentInputRef}
                          value={commentText}
                          onChange={handleCommentChange}
                          placeholder="添加评论... 使用 @ 提及团队成员"
                          className="w-full resize-none rounded-md border border-app-border bg-app-bg px-3 py-2 text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />

                        {showMentionList && filteredMembers.length > 0 && (
                          <div className="absolute bottom-full left-0 right-0 z-10 max-h-48 overflow-y-auto rounded-md border border-app-border bg-app-content-bg shadow-lg">
                            {filteredMembers.map((member) => (
                              <button
                                key={member.id}
                                onClick={() => handleMentionSelect(member)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-app-button-hover"
                              >
                                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-app-button-hover">
                                  {member.avatarUrl ? (
                                    <img
                                      src={member.avatarUrl}
                                      alt={member.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs text-app-text-primary">
                                      {getAvatarFallback(member.name)}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-app-text-primary">
                                    {member.name}
                                  </div>
                                  <div className="truncate text-xs text-app-text-muted">
                                    {member.email || member.id}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-app-text-muted">
                            <RiAtLine className="h-3 w-3" />
                            <span>使用 @ 提及当前工作空间成员</span>
                          </div>
                          <button
                            onClick={handleSendComment}
                            disabled={!commentText.trim()}
                            className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <RiSendPlaneLine className="h-3 w-3" />
                            发送
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
