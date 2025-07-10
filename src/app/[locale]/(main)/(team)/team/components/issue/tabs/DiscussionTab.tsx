"use client";

import React, { useRef, useState } from "react";
import { RiAtLine, RiSendPlaneLine } from "react-icons/ri";

interface TeamMember {
  id: string;
  user?: {
    name?: string;
    email?: string;
    avatar_url?: string;
  };
}

interface Comment {
  id: string;
  content: string;
  author: string;
  authorAvatar?: string;
  createdAt: string;
  mentions: string[];
}

interface DiscussionTabProps {
  comments: Comment[];
  teamMembers: TeamMember[];
  userAvatar?: string;
  userName?: string;
  onSendComment: (comment: string) => void;
}

export const DiscussionTab: React.FC<DiscussionTabProps> = ({
  comments,
  teamMembers,
  userAvatar,
  userName,
  onSendComment,
}) => {
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
    const newText = `${beforeAt}@${member.user?.name} ${afterCursor}`;

    setCommentText(newText);
    setShowMentionList(false);
    setMentionQuery("");

    // 重新聚焦到输入框
    setTimeout(() => {
      if (commentInputRef.current) {
        const newCursorPos = atIndex + (member.user?.name?.length || 0) + 2;
        commentInputRef.current.focus();
        commentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // 发送评论
  const handleSendComment = () => {
    if (!commentText.trim()) return;
    onSendComment(commentText);
    setCommentText("");
    setShowMentionList(false);
  };

  const filteredMembers = teamMembers.filter((member) =>
    member.user?.name?.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Discussion Content */}
      <div className="flex-1 overflow-y-auto p-4">
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
                  {comment.content.split(/(@\w+)/).map((part, index) => (
                    <span
                      key={index}
                      className={
                        part.startsWith("@") ? "text-blue-600 font-medium" : ""
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

      {/* Comment Input */}
      <div className="p-4 border-t border-app-border">
        <div className="relative">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-sm flex-shrink-0 overflow-hidden">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm">{userName?.[0]}</span>
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
                      <span className="text-lg">{member.user?.avatar_url}</span>
                      <div>
                        <div className="text-sm font-medium text-app-text-primary">
                          {member.user?.name}
                        </div>
                        <div className="text-xs text-app-text-muted">
                          {member.user?.email}
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
  );
};

export default DiscussionTab;
