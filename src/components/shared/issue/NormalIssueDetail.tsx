"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  RiCloseLine,
  RiEditLine,
  RiSaveLine,
  RiSendPlaneLine,
  RiAtLine,
  RiCalendarLine,
  RiUserLine,
  RiPriceTagLine,
  RiFileTextLine,
  RiTimeLine,
  RiCheckLine,
} from "react-icons/ri";
import { Issue } from "@/lib/fetchers/issue";
import { useAuth } from "@/context/AuthContext";

// 扩展的 Issue 接口，支持个人空间的额外字段
interface ExtendedIssue extends Issue {
  deadline?: string;
  tags?: string;
  notes?: string;
}

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

// 模拟团队成员数据
const teamMembers = [
  { id: "1", name: "张三", email: "zhangsan@example.com", avatar: "👨‍💻" },
  { id: "2", name: "李四", email: "lisi@example.com", avatar: "👩‍💼" },
  { id: "3", name: "王五", email: "wangwu@example.com", avatar: "👨‍🎨" },
  { id: "4", name: "赵六", email: "zhaoliu@example.com", avatar: "👩‍🔬" },
];

const statusOptions = [
  { value: "todo", label: "待处理", color: "bg-gray-100 text-gray-700" },
  { value: "in_progress", label: "进行中", color: "bg-blue-100 text-blue-700" },
  { value: "done", label: "已完成", color: "bg-green-100 text-green-700" },
  { value: "canceled", label: "已取消", color: "bg-red-100 text-red-700" },
];

const priorityOptions = [
  { value: "low", label: "低", color: "bg-gray-100 text-gray-700" },
  { value: "medium", label: "中", color: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "高", color: "bg-orange-100 text-orange-700" },
  { value: "urgent", label: "紧急", color: "bg-red-100 text-red-700" },
];

export default function NormalIssueDetail({
  issue,
  isOpen,
  onClose,
  onUpdate,
}: NormalIssueDetailProps) {
  const { user } = useAuth();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [localIssue, setLocalIssue] = useState<Issue>(issue);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      content: "这个Issue看起来很重要，我们需要尽快处理。",
      author: "张三",
      authorAvatar: user?.user_metadata.avatar_url as string,
      createdAt: "2024-01-10T10:30:00Z",
      mentions: [],
    },
    {
      id: "2",
      content: "我同意，@李四 你能帮忙看一下相关的技术方案吗？",
      author: "王五",
      authorAvatar: user?.user_metadata.avatar_url as string,
      createdAt: "2024-01-10T11:15:00Z",
      mentions: ["李四"],
    },
  ]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalIssue(issue);
  }, [issue]);

  const handleFieldEdit = (field: string) => {
    setEditingField(field);
  };

  const handleFieldSave = (field: string, value: string | undefined) => {
    const updatedIssue = {
      ...localIssue,
      [field]: value,
      updatedAt: new Date().toISOString(),
    };
    setLocalIssue(updatedIssue);
    setEditingField(null);
    onUpdate(updatedIssue);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    setCommentText(value);
    setCursorPosition(cursorPos);

    // 检测@符号
    const atIndex = value.lastIndexOf("@", cursorPos);
    if (atIndex !== -1 && (atIndex === 0 || value[atIndex - 1] === " ")) {
      const query = value.substring(atIndex + 1, cursorPos);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setShowMentionList(true);
        return;
      }
    }
    setShowMentionList(false);
  };

  const handleMentionSelect = (member: (typeof teamMembers)[0]) => {
    const atIndex = commentText.lastIndexOf("@", cursorPosition);
    const beforeAt = commentText.substring(0, atIndex);
    const afterCursor = commentText.substring(cursorPosition);
    const newText = `${beforeAt}@${member.name} ${afterCursor}`;

    setCommentText(newText);
    setShowMentionList(false);
    setMentionQuery("");

    // 重新聚焦到输入框
    setTimeout(() => {
      if (commentInputRef.current) {
        const newCursorPos = atIndex + member.name.length + 2;
        commentInputRef.current.focus();
        commentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // MARK: - Handle Comment
  const handleSendComment = () => {
    if (!commentText.trim()) return;

    // 提取@提及的用户
    const mentions =
      commentText.match(/@(\w+)/g)?.map((mention) => mention.substring(1)) ||
      [];

    const newComment: Comment = {
      id: Date.now().toString(),
      content: commentText,
      author: user?.user_metadata.name as string,
      authorAvatar: user?.user_metadata.avatar_url as string,
      createdAt: new Date().toISOString(),
      mentions,
    };

    setComments([...comments, newComment]);
    setCommentText("");
    setShowMentionList(false);
  };

  const filteredMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  const getStatusOption = (status: string) => {
    return (
      statusOptions.find((option) => option.value === status) ||
      statusOptions[0]
    );
  };

  const getPriorityOption = (priority: string) => {
    return (
      priorityOptions.find((option) => option.value === priority) ||
      priorityOptions[1]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-full dark:bg-black/50 bg-white/80 flex items-center justify-center z-50">
      <div className="bg-app-bg rounded-lg shadow-xl w-full max-w-screen h-[calc(100vh-56px)] overflow-hidden relative">
        <div className="h-full p-2">
          <div className="h-full flex flex-col gap-2">
            {/* Issue Info Header */}
            <div className="bg-app-content-bg rounded-lg border border-app-border p-4 flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-app-text-primary mb-2">
                    {localIssue.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-app-text-muted">
                    <span>#{localIssue.id}</span>
                    <span>
                      状态: {getStatusOption(localIssue.status || "").label}
                    </span>
                    <span>
                      优先级:{" "}
                      {getPriorityOption(localIssue.priority || "").label}
                    </span>
                    {localIssue.assignee && (
                      <span>负责人: {localIssue.assignee}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-app-button-hover rounded-lg transition-colors"
                >
                  <RiCloseLine className="w-5 h-5 text-app-text-secondary" />
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-h-0 flex gap-2">
              {/* 左侧：Issue详情和属性 (2/3) */}
              <div className="w-2/3 bg-app-content-bg rounded-lg border border-app-border flex flex-col">
                <div className="p-4 border-b border-app-border flex-shrink-0">
                  <h3 className="text-lg font-semibold text-app-text-primary">
                    Issue 详情
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex flex-col gap-6">
                    {/* Issue内容 */}
                    <div className="space-y-6">
                      {/* 标题 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-app-text-primary">
                            标题
                          </label>
                          {editingField !== "title" && (
                            <button
                              onClick={() => handleFieldEdit("title")}
                              className="p-1 hover:bg-app-button-hover rounded"
                            >
                              <RiEditLine className="w-4 h-4 text-app-text-secondary" />
                            </button>
                          )}
                        </div>
                        {editingField === "title" ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={localIssue.title}
                              onChange={(e) =>
                                setLocalIssue({
                                  ...localIssue,
                                  title: e.target.value,
                                })
                              }
                              className="flex-1 px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() =>
                                handleFieldSave("title", localIssue.title)
                              }
                              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              <RiSaveLine className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <h3 className="text-lg font-medium text-app-text-primary">
                            {localIssue.title}
                          </h3>
                        )}
                      </div>
                    </div>

                    {/* MARK: Issue属性
                     */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-app-text-primary border-b border-app-border pb-2">
                        Issue 属性
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        {/* 状态 */}
                        <div
                        // MARK: 状态
                        >
                          <label className="block text-xs font-medium text-app-text-secondary mb-1">
                            状态
                          </label>
                          {editingField === "status" ? (
                            <select
                              value={localIssue.status || ""}
                              onChange={(e) =>
                                handleFieldSave("status", e.target.value)
                              }
                              className="w-full px-2 py-1 border border-app-border rounded bg-app-bg text-app-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => handleFieldEdit("status")}
                              className={`w-full text-left px-2 py-1 rounded text-sm hover:opacity-80 transition-opacity`}
                            >
                              {getStatusOption(localIssue.status || "").label}
                            </button>
                          )}
                        </div>
                        {/* 优先级 */}
                        <div
                        // MARK: 优先级
                        >
                          <label className="block text-xs font-medium text-app-text-secondary mb-1">
                            优先级
                          </label>
                          {editingField === "priority" ? (
                            <select
                              value={localIssue.priority}
                              onChange={(e) =>
                                handleFieldSave("priority", e.target.value)
                              }
                              className="w-full px-2 py-1 border border-app-border rounded bg-app-bg text-app-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            >
                              {priorityOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => handleFieldEdit("priority")}
                              className={`w-full text-left px-2 py-1 rounded text-sm
                        
                               hover:opacity-80 transition-opacity`}
                            >
                              {
                                getPriorityOption(localIssue.priority || "")
                                  .label
                              }
                            </button>
                          )}
                        </div>
                        {/* 负责人 */}
                        <div
                        // MARK: 负责人
                        >
                          <label className="block text-xs font-medium text-app-text-secondary mb-1 flex items-center gap-1">
                            <RiUserLine className="w-3 h-3" />
                            负责人
                          </label>
                          {editingField === "assignee" ? (
                            <div className="flex flex-row gap-2">
                              <input
                                type="text"
                                value={localIssue.assignee || ""}
                                onChange={(e) =>
                                  setLocalIssue({
                                    ...localIssue,
                                    assignee: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border border-app-border rounded bg-app-bg text-app-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="输入负责人..."
                                autoFocus
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    handleFieldSave(
                                      "assignee",
                                      localIssue.assignee || ""
                                    )
                                  }
                                  className="px-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                >
                                  <RiCheckLine className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingField(null)}
                                  className="px-2 border border-app-border rounded text-xs hover:bg-app-button-hover"
                                >
                                  <RiCloseLine className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleFieldEdit("assignee")}
                              className="w-full text-left px-2 py-1 text-sm text-app-text-primary hover:bg-app-button-hover rounded transition-colors"
                            >
                              {localIssue.assignee || "未分配"}
                            </button>
                          )}
                        </div>
                        {/* 项目 */}
                        <div
                        // MARK: 项目
                        >
                          <label className="block text-xs font-medium text-app-text-secondary mb-1 flex items-center gap-1">
                            <RiPriceTagLine className="w-3 h-3" />
                            项目
                          </label>
                          {editingField === "project" ? (
                            <div className="flex flex-row gap-2">
                              <input
                                // FIXME: 添加项目属性
                                type="text"
                                value={"Synaply"}
                                onChange={() =>
                                  setLocalIssue({
                                    ...localIssue,
                                    // project: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border border-app-border rounded bg-app-bg text-app-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="输入项目名称..."
                                autoFocus
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() =>
                                    handleFieldSave("project", "Synaply")
                                  }
                                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                >
                                  <RiCheckLine className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingField(null)}
                                  className="px-2 py-1 border border-app-border rounded text-xs hover:bg-app-button-hover"
                                >
                                  <RiCloseLine className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleFieldEdit("project")}
                              className="w-full text-left px-2 py-1 text-sm text-app-text-primary hover:bg-app-button-hover rounded transition-colors"
                            >
                              {"Synaply"}
                            </button>
                          )}
                        </div>
                        {/* 截止时间 (如果有) */}
                        {(localIssue as ExtendedIssue).deadline && (
                          <div
                          // MARK: 截止时间
                          >
                            <label className="block text-xs font-medium text-app-text-secondary mb-1 flex items-center gap-1">
                              <RiCalendarLine className="w-3 h-3" />
                              截止时间
                            </label>
                            <div className="text-sm text-app-text-primary">
                              {new Date(
                                (localIssue as ExtendedIssue).deadline!
                              ).toLocaleDateString("zh-CN")}
                            </div>
                          </div>
                        )}
                        {/* 标签 (如果有) */}
                        {(localIssue as ExtendedIssue).tags && (
                          <div>
                            <label className="block text-xs font-medium text-app-text-secondary mb-1">
                              标签
                            </label>
                            <div className="flex flex-wrap gap-1">
                              {(localIssue as ExtendedIssue)
                                .tags!.split(",")
                                .map((tag: string, index: number) => (
                                  <span
                                    key={index}
                                    className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                                  >
                                    {tag.trim()}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* MARK: 描述
                       */}
                      <div className="border-t border-app-border p-2 h-full">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-app-text-primary">
                            描述
                          </label>
                          {editingField !== "description" && (
                            <button
                              onClick={() => handleFieldEdit("description")}
                              className="p-1 hover:bg-app-button-hover rounded"
                            >
                              <RiEditLine className="w-4 h-4 text-app-text-secondary" />
                            </button>
                          )}
                        </div>
                        {editingField === "description" ? (
                          <div className="space-y-2">
                            <textarea
                              value={localIssue.description || ""}
                              onChange={(e) =>
                                setLocalIssue({
                                  ...localIssue,
                                  description: e.target.value,
                                })
                              }
                              className="max-h-[600px] min-h-[200px] w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                              rows={4}
                              placeholder="添加描述..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleFieldSave(
                                    "description",
                                    localIssue.description
                                  )
                                }
                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingField(null)}
                                className="px-3 py-1 border border-app-border rounded text-sm hover:bg-app-button-hover transition-colors"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-app-text-secondary whitespace-pre-wrap">
                            {localIssue.description || "暂无描述"}
                          </div>
                        )}
                      </div>

                      {/* 时间信息 */}
                      <div className="absolute bottom-4">
                        <div className="space-y-2 text-xs text-app-text-muted">
                          <div className="flex items-center gap-1">
                            <RiTimeLine className="w-3 h-3" />
                            <span>
                              创建时间: {formatDate(localIssue.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <RiTimeLine className="w-3 h-3" />
                            <span>
                              更新时间: {formatDate(localIssue.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧：讨论区域 (1/3) */}
              <div className="w-1/3 bg-app-content-bg rounded-lg border border-app-border flex flex-col">
                <div className="p-4 border-b border-app-border flex-shrink-0">
                  <h4 className="text-lg font-semibold text-app-text-primary flex items-center gap-2">
                    <RiFileTextLine className="w-5 h-5" />
                    讨论 ({comments.length})
                  </h4>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {/* 评论列表 */}
                  <div className="space-y-4 mb-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm flex-shrink-0 overflow-hidden">
                          {comment.authorAvatar ? (
                            <img
                              src={comment.authorAvatar}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm">{comment.author[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-app-text-primary">
                              {comment.author}
                            </span>
                            <span className="text-xs text-app-text-muted">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm text-app-text-secondary">
                            {comment.content
                              .split(/(@\w+)/)
                              .map((part, index) => (
                                <span
                                  key={index}
                                  className={
                                    part.startsWith("@")
                                      ? "text-blue-600 font-medium"
                                      : ""
                                  }
                                >
                                  {part}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 新评论输入 */}
                <div className="p-4 border-t border-app-border">
                  <div className="relative">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm flex-shrink-0 overflow-hidden">
                        {user?.user_metadata.avatar_url ? (
                          <img
                            src={user?.user_metadata.avatar_url}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm">
                            {user?.user_metadata.name?.[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 relative">
                        <textarea
                          ref={commentInputRef}
                          value={commentText}
                          onChange={handleCommentChange}
                          placeholder="添加评论... 使用@提及团队成员"
                          className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                        />

                        {/* @提及列表 */}
                        {showMentionList && (
                          <div className="absolute bottom-full left-0 right-0 mt-1 bg-app-content-bg border border-app-border rounded-md shadow-lg z-10 overflow-y-auto">
                            {filteredMembers.map((member) => (
                              <button
                                key={member.id}
                                onClick={() => handleMentionSelect(member)}
                                className="w-full px-3 py-2 text-left hover:bg-app-button-hover flex items-center gap-2"
                              >
                                <span className="text-lg">{member.avatar}</span>
                                <div>
                                  <div className="text-sm font-medium text-app-text-primary">
                                    {member.name}
                                  </div>
                                  <div className="text-xs text-app-text-muted">
                                    {member.email}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-2 text-xs text-app-text-muted">
                            <RiAtLine className="w-3 h-3" />
                            <span>使用@提及团队成员</span>
                          </div>
                          <button
                            onClick={handleSendComment}
                            disabled={!commentText.trim()}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <RiSendPlaneLine className="w-3 h-3" />
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
