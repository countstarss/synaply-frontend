"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  createAiThread as createAiThreadRequest,
  getAiThread as getAiThreadRequest,
  listAiThreadMessages as listAiThreadMessagesRequest,
  listAiThreads,
} from "@/lib/fetchers/ai-thread";
import type { AiSurfaceType } from "@/lib/ai/types";
import { useAiThreadStore } from "@/stores/ai-thread";

interface UseAiThreadOptions {
  workspaceId: string;
  originSurfaceType: AiSurfaceType;
  originSurfaceId: string;
  originTitle?: string | null;
  enabled?: boolean;
}

export function useAiThread({
  workspaceId,
  originSurfaceType,
  originSurfaceId,
  originTitle,
  enabled = true,
}: UseAiThreadOptions) {
  const { session } = useAuth();
  const {
    currentThreadId,
    messages,
    isLoading,
    isStreaming,
    error,
    setCurrentThreadId,
    setMessages,
    setLoading,
    setError,
    reset,
  } = useAiThreadStore();

  const originKey = `${workspaceId}:${originSurfaceType}:${originSurfaceId}`;

  useEffect(() => {
    reset();
  }, [originKey, reset]);

  const threadListQuery = useQuery({
    queryKey: ["ai-threads", workspaceId],
    queryFn: async () => {
      if (!session?.access_token) {
        return [];
      }

      return listAiThreads(workspaceId, session.access_token);
    },
    enabled: enabled && Boolean(session?.access_token && workspaceId),
  });

  const createThreadMutation = useMutation({
    mutationFn: async () => {
      if (!session?.access_token) {
        throw new Error("未授权");
      }

      return createAiThreadRequest(workspaceId, session.access_token, {
        title: originTitle ? `${originTitle} · AI 助手` : "AI 协作线程",
        originSurfaceType,
        originSurfaceId,
      });
    },
    onSuccess: (thread) => {
      setCurrentThreadId(thread.id);
      setError(null);
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "创建 AI 线程失败",
      );
    },
  });

  useEffect(() => {
    if (!enabled || !session?.access_token || !workspaceId || currentThreadId) {
      return;
    }

    if (threadListQuery.isLoading || createThreadMutation.isPending) {
      return;
    }

    const existingThread = threadListQuery.data?.find(
      (thread) =>
        thread.originSurfaceType === originSurfaceType &&
        thread.originSurfaceId === originSurfaceId,
    );

    if (existingThread) {
      setCurrentThreadId(existingThread.id);
      return;
    }

    if (threadListQuery.data) {
      createThreadMutation.mutate();
    }
  }, [
    createThreadMutation,
    currentThreadId,
    enabled,
    originSurfaceId,
    originSurfaceType,
    session?.access_token,
    setCurrentThreadId,
    threadListQuery.data,
    threadListQuery.isLoading,
    workspaceId,
  ]);

  const threadQuery = useQuery({
    queryKey: ["ai-thread", workspaceId, currentThreadId],
    queryFn: async () => {
      if (!session?.access_token || !currentThreadId) {
        return null;
      }

      return getAiThreadRequest(
        workspaceId,
        currentThreadId,
        session.access_token,
      );
    },
    enabled:
      enabled &&
      Boolean(session?.access_token && workspaceId && currentThreadId),
  });

  const messagesQuery = useQuery({
    queryKey: ["ai-thread-messages", workspaceId, currentThreadId],
    queryFn: async () => {
      if (!session?.access_token || !currentThreadId) {
        return null;
      }

      return listAiThreadMessagesRequest(
        workspaceId,
        currentThreadId,
        session.access_token,
      );
    },
    enabled:
      enabled &&
      Boolean(session?.access_token && workspaceId && currentThreadId),
  });

  useEffect(() => {
    setLoading(
      threadListQuery.isLoading ||
        createThreadMutation.isPending ||
        threadQuery.isLoading ||
        messagesQuery.isLoading,
    );
  }, [
    createThreadMutation.isPending,
    messagesQuery.isLoading,
    setLoading,
    threadListQuery.isLoading,
    threadQuery.isLoading,
  ]);

  useEffect(() => {
    if (messagesQuery.data?.items && !isStreaming) {
      setMessages(messagesQuery.data.items);
    }
  }, [isStreaming, messagesQuery.data?.items, setMessages]);

  useEffect(() => {
    const queryError =
      createThreadMutation.error ??
      threadListQuery.error ??
      threadQuery.error ??
      messagesQuery.error;

    if (!queryError) {
      return;
    }

    setError(
      queryError instanceof Error ? queryError.message : "加载 AI 线程失败",
    );
  }, [
    createThreadMutation.error,
    messagesQuery.error,
    setError,
    threadListQuery.error,
    threadQuery.error,
  ]);

  return {
    thread: threadQuery.data,
    threadId: currentThreadId,
    messages,
    isLoading,
    error,
  };
}
