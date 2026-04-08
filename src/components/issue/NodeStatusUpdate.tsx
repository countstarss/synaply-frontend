"use client";

import React, { useState } from "react";
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiMessageLine,
} from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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

  const statusOptions = [
    { value: "TODO", label: "待处理" },
    { value: "IN_PROGRESS", label: "进行中" },
    { value: "AMOST_DONE", label: "接近完成" },
    { value: "DONE", label: "已完成" },
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
    <Card className="border-app-border bg-app-content-bg shadow-none">
      <CardHeader className="p-4">
        <CardTitle className="text-lg text-app-text-primary">节点状态更新</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-4 pb-4">
        <div className="space-y-2">
          <Label className="text-sm text-app-text-primary">当前负责人</Label>
          <Badge
            variant="outline"
            className="rounded-md border-app-border px-3 py-1.5 text-sm font-normal text-app-text-primary"
          >
            {assignee || "未分配"}
          </Badge>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-app-text-primary">状态</Label>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((option) => {
              const isActive = currentStatus === option.value;

              return (
                <Button
                  key={option.value}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "justify-center border-app-border",
                    isActive
                      ? "bg-sky-600 text-white hover:bg-sky-500"
                      : "bg-app-bg text-app-text-primary hover:bg-app-button-hover",
                  )}
                  disabled={!canEdit}
                  onClick={() => handleStatusChange(option.value)}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-app-text-primary">添加备注</Label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 rounded-md text-app-text-secondary hover:bg-app-button-hover hover:text-app-text-primary"
              onClick={() => setShowCommentInput((value) => !value)}
            >
              <RiMessageLine className="h-4 w-4" />
            </Button>
          </div>

          {showCommentInput && (
            <div className="space-y-2">
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="输入备注..."
                rows={3}
                className="border-app-border bg-app-bg text-app-text-primary"
              />
              <Button
                type="button"
                className="bg-sky-600 text-white hover:bg-sky-500"
                disabled={!canEdit || !comment.trim()}
                onClick={handleAddComment}
              >
                添加备注
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-between border-t border-app-border pt-4">
          <Button
            type="button"
            variant="outline"
            className="border-app-border bg-transparent text-app-text-primary"
            disabled={!canPrevious}
            onClick={onPrevious}
          >
            <RiArrowLeftLine className="h-4 w-4" />
            上一步
          </Button>
          <Button
            type="button"
            className="bg-sky-600 text-white hover:bg-sky-500"
            disabled={!canEdit || !canNext || currentStatus !== "DONE"}
            onClick={onNext}
          >
            下一步
            <RiArrowRightLine className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default NodeStatusUpdate;
