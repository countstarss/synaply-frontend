"use client";

import React from "react";
import { ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
// 使用新的 Issue 类型
import { Issue } from "@/lib/fetchers/issue";

import { WorkflowIssueDetailFlow } from "./WorkflowIssueDetailFlow";

interface WorkflowIssueDetailProps {
  issue: Issue;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  displayMode?: "dialog" | "page";
}

export default function WorkflowIssueDetail({
  issue,
  isOpen,
  onClose,
  onUpdate,
  displayMode = "dialog",
}: WorkflowIssueDetailProps) {
  if (!isOpen) return null;

  const content = (
    <ReactFlowProvider>
      <WorkflowIssueDetailFlow
        issue={issue}
        isOpen={isOpen}
        onClose={onClose}
        onUpdate={onUpdate}
      />
    </ReactFlowProvider>
  );

  if (displayMode === "page") {
    return <div className="h-full w-full overflow-hidden">{content}</div>;
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="h-[calc(100vh-56px)] max-w-[calc(100vw-16px)] border-app-border bg-app-bg p-2 shadow-xl"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{issue.title || "工作流 Issue 详情"}</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
}
