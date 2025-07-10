"use client";

import React, { useState } from "react";
import {
  RiArrowRightLine,
  RiArrowLeftLine,
  RiMessageLine,
} from "react-icons/ri";

interface NodeStatusUpdateProps {
  nodeId: string;
  currentStatus: string;
  assignee?: string;
  canEdit: boolean;
  onStatusUpdate: (nodeId: string, status: string, comment?: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  canNext: boolean;
  canPrevious: boolean;
}

export function NodeStatusUpdate({
  nodeId,
  currentStatus,
  assignee,
  canEdit,
  onStatusUpdate,
  onNext,
  onPrevious,
  canNext,
  canPrevious,
}: NodeStatusUpdateProps) {
  const [comment, setComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);

  const statusOptions = [
    { value: "TODO", label: "待处理", color: "gray" },
    { value: "IN_PROGRESS", label: "进行中", color: "blue" },
    { value: "AMOST_DONE", label: "接近完成", color: "yellow" },
    { value: "DONE", label: "已完成", color: "green" },
  ];

  const handleStatusChange = (newStatus: string) => {
    if (newStatus !== currentStatus) {
      onStatusUpdate(nodeId, newStatus, comment.trim() || undefined);
      setComment("");
      setShowCommentInput(false);
    }
  };

  const handleAddComment = () => {
    if (comment.trim()) {
      onStatusUpdate(nodeId, currentStatus, comment.trim());
      setComment("");
      setShowCommentInput(false);
    }
  };

  return (
    <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
      <h3 className="text-lg font-semibold text-app-text-primary mb-4">
        节点状态更新
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-app-text-primary mb-2">
            当前负责人: {assignee || "未分配"}
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-app-text-primary mb-2">
            状态
          </label>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={`p-2 text-sm rounded border transition-colors ${
                  currentStatus === option.value
                    ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-600"
                    : "bg-app-bg hover:bg-app-button-hover border-app-border"
                }`}
                disabled={!canEdit}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-app-text-primary">
              添加备注
            </label>
            <button
              onClick={() => setShowCommentInput(!showCommentInput)}
              className="p-1 hover:bg-app-button-hover rounded transition-colors"
            >
              <RiMessageLine className="w-4 h-4 text-app-text-secondary" />
            </button>
          </div>
          {showCommentInput && (
            <div className="space-y-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="输入备注..."
                rows={3}
                className="w-full px-3 py-2 border border-app-border rounded-md bg-app-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddComment}
                disabled={!canEdit || !comment.trim()}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded transition-colors disabled:cursor-not-allowed"
              >
                添加备注
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t border-app-border">
          <button
            onClick={onPrevious}
            disabled={!canPrevious}
            className="flex items-center gap-2 px-3 py-2 text-sm text-app-text-secondary hover:text-app-text-primary disabled:opacity-50 disabled:cursor-not-allowed border border-app-border rounded transition-colors"
          >
            <RiArrowLeftLine className="w-4 h-4" />
            上一步
          </button>
          <button
            onClick={onNext}
            disabled={!canEdit || !canNext || currentStatus !== "DONE"}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded transition-colors disabled:cursor-not-allowed"
          >
            下一步
            <RiArrowRightLine className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default NodeStatusUpdate;
