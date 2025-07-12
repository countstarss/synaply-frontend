"use client";

import React, { useRef, useState } from "react";
import { RiAtLine, RiSendPlaneLine } from "react-icons/ri";
import { useComments, useCreateComment } from "@/hooks/useComment";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeamMember {
  id: string;
  user?: {
    name?: string;
    email?: string;
    avatar_url?: string;
  };
}

interface DiscussionTabProps {
  issueId: string;
  workspaceId: string;
  teamMembers: TeamMember[];
}

export const DiscussionTab: React.FC<DiscussionTabProps> = ({
  issueId,
  workspaceId,
  teamMembers,
}) => {
  const { session } = useAuth();
  const { data: comments = [], isLoading } = useComments(issueId);
  const { mutate: submitComment, isPending: isSubmitting } = useCreateComment();

  const [commentText, setCommentText] = useState("");
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

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

  // @用户选择
  const handleMentionSelect = (member: TeamMember) => {
    const atIndex = commentText.lastIndexOf("@", cursorPosition);
    const beforeAt = commentText.substring(0, atIndex);
    const afterCursor = commentText.substring(cursorPosition);
    const newText = `${beforeAt}@${
      member.user?.name || member.user?.email?.split("@")[0]
    } ${afterCursor}`;

    setCommentText(newText);
    setShowMentionList(false);
    setMentionQuery("");

    // 重新聚焦到输入框
    setTimeout(() => {
      if (commentInputRef.current) {
        const newCursorPos =
          atIndex +
          ((member.user?.name || member.user?.email?.split("@")[0])?.length ||
            0) +
          2;
        commentInputRef.current.focus();
        commentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // 发送评论
  const handleSendComment = () => {
    if (!commentText.trim()) return;

    submitComment({
      content: commentText,
      issueId,
      workspaceId,
    });

    setCommentText("");
    setShowMentionList(false);
  };

  const filteredMembers = teamMembers.filter((member) =>
    (member.user?.name || member.user?.email || "")
      .toLowerCase()
      .includes(mentionQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Discussion Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-app-text-muted">
            暂无评论，成为第一个发表评论的人吧
          </div>
        ) : (
          <div className="space-y-4 mb-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="flex-shrink-0">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.author.avatarUrl!} />
                    <AvatarFallback>
                      {comment.author.name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-app-text-primary">
                      {comment.author.name! ||
                        comment.author.email?.split("@")[0]}
                    </span>
                    <span className="text-xs text-app-text-muted">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm text-app-text-secondary">
                    {comment.content.split(/(@\w+)/).map((part, index) => (
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
        )}
      </div>

      {/* Comment Input */}
      <div className="p-4 border-t border-app-border relative">
        <div className="relative">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <Avatar className="w-8 h-8">
                <AvatarImage
                  src={session?.user?.user_metadata?.avatar_url || ""}
                />
                <AvatarFallback>
                  {session?.user?.email?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={commentInputRef}
                value={commentText}
                onChange={handleCommentChange}
                placeholder="添加评论... 使用@提及团队成员"
                className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
                disabled={isSubmitting}
              />

              {/* @提及列表 - 放在外层容器中以提高z-index优先级 */}
              {showMentionList && (
                <div className="absolute bottom-[100%] left-0 right-0 mb-1 bg-app-content-bg border border-app-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {filteredMembers.length === 0 ? (
                    <div className="px-3 py-2 text-app-text-muted text-sm">
                      没有找到匹配的成员
                    </div>
                  ) : (
                    filteredMembers.map((member, index) => (
                      <button
                        key={index}
                        onClick={() => handleMentionSelect(member)}
                        className="w-full px-3 py-2 text-left hover:bg-app-button-hover flex items-center gap-2"
                      >
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.user?.avatar_url || ""} />
                          <AvatarFallback>
                            {member.user?.name?.[0] ||
                              member.user?.email?.[0] ||
                              "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-app-text-primary">
                            {member.user?.name ||
                              member.user?.email?.split("@")[0]}
                          </div>
                          <div className="text-xs text-app-text-muted">
                            {member.user?.email}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-2 text-xs text-app-text-muted">
                  <RiAtLine className="w-3 h-3" />
                  <span>使用@提及团队成员</span>
                </div>
                <button
                  onClick={handleSendComment}
                  disabled={!commentText.trim() || isSubmitting}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="w-3 h-3 border-2 border-white rounded-full border-t-transparent animate-spin mr-1"></span>
                  ) : (
                    <RiSendPlaneLine className="w-3 h-3" />
                  )}
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionTab;
