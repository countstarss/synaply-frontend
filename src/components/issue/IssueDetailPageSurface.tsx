"use client";

import React from "react";
import { RiArrowLeftLine, RiLoader4Line } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useIssue } from "@/hooks/useIssueApi";
import { isWorkflowIssue } from "@/lib/fetchers/issue";
import WorkflowIssueDetail from "@/components/issue/WorkflowIssueDetail";
import NormalIssueDetail from "@/components/shared/issue/NormalIssueDetail";

interface IssueDetailPageSurfaceProps {
  issueId: string;
  workspaceId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface IssueDetailFallbackProps {
  title: string;
  description: string;
  isLoading?: boolean;
  onClose: () => void;
}

function IssueDetailFallback({
  title,
  description,
  isLoading = false,
  onClose,
}: IssueDetailFallbackProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-app-bg px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        {isLoading && (
          <RiLoader4Line className="mb-4 size-6 animate-spin text-app-text-secondary" />
        )}
        <h2 className="text-base font-semibold text-app-text-primary">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-app-text-secondary">
          {description}
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-5 rounded-lg border-app-border bg-transparent text-app-text-primary"
          onClick={onClose}
        >
          <RiArrowLeftLine className="h-4 w-4" />
          返回列表
        </Button>
      </div>
    </div>
  );
}

export default function IssueDetailPageSurface({
  issueId,
  workspaceId,
  onClose,
  onUpdate,
}: IssueDetailPageSurfaceProps) {
  const { loading: isAuthLoading } = useAuth();
  const { data: issue, isLoading } = useIssue(workspaceId, issueId, {
    enabled: Boolean(workspaceId && issueId),
  });

  if (!workspaceId) {
    return (
      <IssueDetailFallback
        title="暂无工作空间"
        description="选择一个 workspace 后，才能查看这条任务。"
        onClose={onClose}
      />
    );
  }

  if (isAuthLoading || isLoading || !issue) {
    return (
      <IssueDetailFallback
        title={isAuthLoading || isLoading ? "正在加载任务" : "任务不存在"}
        description={
          isAuthLoading || isLoading
            ? "正在同步任务详情和协作上下文。"
            : "这条任务可能已经被删除，或你当前没有访问权限。"
        }
        isLoading={isAuthLoading || isLoading}
        onClose={onClose}
      />
    );
  }

  if (isWorkflowIssue(issue)) {
    return (
      <WorkflowIssueDetail
        issueId={issue.id}
        workspaceId={workspaceId}
        isOpen
        onClose={onClose}
        onUpdate={onUpdate}
        displayMode="page"
      />
    );
  }

  return (
    <NormalIssueDetail
      issueId={issue.id}
      workspaceId={workspaceId}
      isOpen
      onClose={onClose}
      onUpdate={(updatedIssue) => {
        void updatedIssue;
        onUpdate();
      }}
      displayMode="page"
    />
  );
}
