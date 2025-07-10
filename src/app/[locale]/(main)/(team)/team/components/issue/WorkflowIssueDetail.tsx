"use client";

import React from "react";
import { ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
// 使用新的 Issue 类型
import { Issue } from "@/lib/fetchers/issue";

import { WorkflowIssueDetailFlow } from "./WorkflowIssueDetailFlow";

interface WorkflowIssueDetailProps {
  issue: Issue;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function WorkflowIssueDetail({
  issue,
  isOpen,
  onClose,
  onUpdate,
}: WorkflowIssueDetailProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-full  dark:bg-black/50 bg-white/80 flex items-center justify-center z-50">
      <div className="bg-app-bg rounded-lg shadow-xl w-full max-w-screen h-[calc(100vh-56px)] overflow-hidden">
        <div className="h-full p-2">
          <ReactFlowProvider>
            <WorkflowIssueDetailFlow
              issue={issue}
              isOpen={isOpen}
              onClose={onClose}
              onUpdate={onUpdate}
            />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
