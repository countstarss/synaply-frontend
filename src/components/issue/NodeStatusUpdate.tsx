"use client";

import React, { useState } from "react";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiMessageLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
  const canMoveNext = canEdit && canNext && currentStatus === "DONE";

  const statusOptions = [
    { value: "TODO", label: "待处理" },
    { value: "IN_PROGRESS", label: "进行中" },
    { value: "AMOST_DONE", label: "接近完成" },
    { value: "DONE", label: "已完成" },
  ];
  const activeStatusIndex = Math.max(
    statusOptions.findIndex((option) => option.value === currentStatus),
    0,
  );

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
    <Card className="border-app-border bg-app-content-bg shadow-none">
      <CardContent className="space-y-3 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-app-text-primary">
              节点状态
            </div>
            <p className="mt-1 text-xs text-app-text-muted">
              点击状态圆点更新进度，完成后进入下一步。
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-md border-app-border px-2.5 py-1 text-xs font-normal text-app-text-primary"
          >
            负责人：{assignee || "未分配"}
          </Badge>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-app-border bg-transparent px-2 text-app-text-primary"
            disabled={!canPrevious}
            onClick={onPrevious}
          >
            <RiArrowLeftLine className="h-4 w-4" />
            上一步
          </Button>

          <div className="relative flex min-w-0 flex-1 items-start justify-between px-2">
            <div className="absolute left-8 right-8 top-3 h-px bg-app-border" />
            {statusOptions.map((option, optionIndex) => {
              const isActive = currentStatus === option.value;
              const isReached = optionIndex <= activeStatusIndex;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={!canEdit}
                  className={cn(
                    "relative z-10 flex min-w-[52px] flex-col items-center gap-1 text-center text-[11px] transition disabled:cursor-not-allowed disabled:opacity-60",
                    isActive
                      ? "text-app-text-primary"
                      : "text-app-text-muted hover:text-app-text-primary",
                  )}
                  onClick={() => handleStatusChange(option.value)}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium transition",
                      isActive
                        ? "border-sky-500 bg-sky-600 text-white shadow-[0_0_0_3px_rgba(14,165,233,0.16)]"
                        : isReached
                          ? "border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-200"
                          : "border-app-border bg-app-bg text-app-text-muted",
                    )}
                  >
                    {optionIndex + 1}
                  </span>
                  <span className="leading-4">{option.label}</span>
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            size="sm"
            className="h-8 bg-sky-600 px-2 text-white hover:bg-sky-500"
            disabled={!canMoveNext}
            onClick={onNext}
          >
            下一步
            <RiArrowRightLine className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-app-border pt-2">
          <p className="text-xs leading-5 text-app-text-muted">
            {!canEdit
              ? "只有当前负责人可以更新节点状态或推进流程。"
              : canNext && currentStatus !== "DONE"
                ? "将当前节点标记为“已完成”后，就可以进入下一步。"
                : "当前节点已准备推进。"}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-md text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
            onClick={() => setShowCommentInput((value) => !value)}
          >
            <RiMessageLine className="h-4 w-4" />
            备注
          </Button>
        </div>

        {showCommentInput && (
          <div className="flex gap-2">
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="输入备注..."
              rows={2}
              className="min-h-16 border-app-border bg-app-bg text-app-text-primary"
            />
            <Button
              type="button"
              className="self-end bg-sky-600 text-white hover:bg-sky-500"
              disabled={!canEdit || !comment.trim()}
              onClick={handleAddComment}
            >
              添加
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NodeStatusUpdate;
