"use client";

import React from "react";
import { ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { RiArrowLeftLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { useIssue } from "@/hooks/useIssueApi";
import { WorkflowIssueDetailFlow } from "./WorkflowIssueDetailFlow";

interface WorkflowIssueDetailProps {
  issueId: string;
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  displayMode?: "dialog" | "page";
}

export default function WorkflowIssueDetail({
  issueId,
  workspaceId,
  isOpen,
  onClose,
  onUpdate,
}: WorkflowIssueDetailProps) {
  const { data: issue, isLoading } = useIssue(workspaceId, issueId, {
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const content = (
    <ReactFlowProvider>
      {issue ? (
        <WorkflowIssueDetailFlow
          issue={issue}
          isOpen={isOpen}
          onClose={onClose}
          onUpdate={onUpdate}
        />
      ) : (
        <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-4 text-app-text-muted">
          <div>{isLoading ? "正在加载 Issue..." : "Issue 不存在或已被删除"}</div>
          {!isLoading && (
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
      )}
    </ReactFlowProvider>
  );

  return <div className="h-full w-full overflow-hidden">{content}</div>;
}
