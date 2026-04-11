"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { streamAiThreadMessage } from "@/lib/fetchers/ai-thread";
import { useAiThreadStore } from "@/stores/ai-thread";

interface UseAiThreadStreamOptions {
  workspaceId: string;
  threadId: string | null;
}

export function useAiThreadStream({
  workspaceId,
  threadId,
}: UseAiThreadStreamOptions) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const {
    addMessage,
    startStreaming,
    appendStreamingText,
    completeStreaming,
    cancelStreaming,
    setError,
  } = useAiThreadStore();

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmedText = text.trim();

      if (!trimmedText) {
        return;
      }

      if (!session?.access_token) {
        throw new Error("未授权");
      }

      if (!threadId) {
        throw new Error("AI 线程尚未准备好");
      }

      addMessage({
        id: `local-user-${Date.now()}`,
        threadId,
        runId: null,
        role: "USER",
        parts: [
          {
            type: "text",
            text: trimmedText,
          },
        ],
        createdAt: new Date().toISOString(),
      });

      setError(null);
      startStreaming();

      try {
        const response = await streamAiThreadMessage(
          workspaceId,
          threadId,
          session.access_token,
          trimmedText,
        );

        if (!response.ok) {
          throw new Error((await response.text()) || "发送 AI 消息失败");
        }

        const reader = response.body?.getReader();

        if (!reader) {
          throw new Error("AI 响应流不可用");
        }

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          appendStreamingText(decoder.decode(value, { stream: true }));
        }

        const finalChunk = decoder.decode();

        if (finalChunk) {
          appendStreamingText(finalChunk);
        }

        completeStreaming();

        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["ai-thread", workspaceId, threadId],
          }),
          queryClient.invalidateQueries({
            queryKey: ["ai-thread-messages", workspaceId, threadId],
          }),
        ]);
      } catch (streamError) {
        cancelStreaming();
        const message =
          streamError instanceof Error
            ? streamError.message
            : "发送 AI 消息失败";
        setError(message);
        addMessage({
          id: `local-system-${Date.now()}`,
          threadId,
          runId: null,
          role: "SYSTEM",
          parts: [
            {
              type: "error",
              message,
            },
          ],
          createdAt: new Date().toISOString(),
        });
        throw streamError;
      }
    },
    [
      addMessage,
      appendStreamingText,
      cancelStreaming,
      completeStreaming,
      queryClient,
      session?.access_token,
      setError,
      startStreaming,
      threadId,
      workspaceId,
    ],
  );

  return {
    sendMessage,
  };
}
