"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RiCheckboxCircleLine, RiCloseCircleLine } from "react-icons/ri";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import {
  confirmAiApproval,
  getAiApproval,
  rejectAiApproval,
} from "@/lib/fetchers/ai-thread";
import type { AiApprovalRequestPart } from "@/lib/ai/types";

interface AiApprovalRequestCardProps {
  threadId: string;
  part: AiApprovalRequestPart;
}

export function AiApprovalRequestCard({
  threadId,
  part,
}: AiApprovalRequestCardProps) {
  const { session } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [resolvedStatus, setResolvedStatus] = useState<
    AiApprovalRequestPart["status"]
  >(part.status ?? "PENDING");

  const workspaceId = currentWorkspace?.id ?? null;
  const approvalQuery = useQuery({
    queryKey: ["ai-approval", workspaceId, threadId, part.approvalId],
    queryFn: async () => {
      if (!workspaceId || !session?.access_token) {
        throw new Error("当前无法读取审批状态");
      }

      return getAiApproval(
        workspaceId,
        threadId,
        part.approvalId,
        session.access_token,
      );
    },
    enabled: Boolean(workspaceId && session?.access_token),
  });
  const currentStatus =
    (approvalQuery.data?.status as AiApprovalRequestPart["status"] | undefined) ??
    resolvedStatus;
  const isResolved = currentStatus !== "PENDING";
  const previewText = useMemo(() => {
    try {
      return JSON.stringify(part.preview ?? part.input, null, 2);
    } catch {
      return String(part.preview ?? part.input);
    }
  }, [part.input, part.preview]);

  const refreshThread = async () => {
    if (!workspaceId) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["ai-thread", workspaceId, threadId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["ai-thread-messages", workspaceId, threadId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["ai-threads", workspaceId],
      }),
    ]);
  };

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !session?.access_token) {
        throw new Error("当前无法确认这个动作");
      }

      return confirmAiApproval(
        workspaceId,
        threadId,
        part.approvalId,
        session.access_token,
      );
    },
    onSuccess: async () => {
      setResolvedStatus("CONFIRMED");
      toast.success("已确认，AI 正在继续执行。");
      await refreshThread();
      await approvalQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "确认失败");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !session?.access_token) {
        throw new Error("当前无法拒绝这个动作");
      }

      return rejectAiApproval(
        workspaceId,
        threadId,
        part.approvalId,
        session.access_token,
      );
    },
    onSuccess: async () => {
      setResolvedStatus("REJECTED");
      toast.success("已拒绝这个动作。");
      await refreshThread();
      await approvalQuery.refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "拒绝失败");
    },
  });

  return (
    <div className="rounded-2xl border border-amber-200/60 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
          Approval
        </span>
        <span className="text-xs text-amber-800/80">
          {resolvedStatus === "CONFIRMED"
            ? "已确认"
            : currentStatus === "CONFIRMED"
              ? "已确认"
              : currentStatus === "REJECTED"
                ? "已拒绝"
                : currentStatus === "EXPIRED"
                  ? "已过期"
                  : "等待确认"}
        </span>
      </div>

      <p className="mt-3 text-sm font-medium leading-6">{part.summary}</p>
      <p className="mt-2 text-xs leading-5 text-amber-900/75">
        动作: <span className="font-mono">{part.actionKey}</span>
      </p>

      {previewText ? (
        <pre className="mt-3 overflow-auto rounded-xl border border-amber-200/80 bg-white/70 p-3 text-xs leading-5 text-amber-950">
          {previewText}
        </pre>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="bg-amber-500 text-white hover:bg-amber-400"
          disabled={
            isResolved || confirmMutation.isPending || rejectMutation.isPending
          }
          onClick={() => void confirmMutation.mutateAsync()}
        >
          <RiCheckboxCircleLine className="mr-2 h-4 w-4" />
          确认执行
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-amber-200 bg-white/70 text-amber-900 hover:bg-white"
          disabled={
            isResolved || confirmMutation.isPending || rejectMutation.isPending
          }
          onClick={() => void rejectMutation.mutateAsync()}
        >
          <RiCloseCircleLine className="mr-2 h-4 w-4" />
          拒绝
        </Button>
      </div>
    </div>
  );
}
