"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WORKSPACE_REALTIME_EVENTS } from "@/lib/realtime/events";
import { buildWorkspaceTopic } from "@/lib/realtime/topics";
import { useRealtimeChannel } from "./useRealtimeChannel";

interface UseWorkspaceRealtimeOptions {
  enabled?: boolean;
}

export function useWorkspaceRealtime(
  workspaceId: string,
  { enabled = true }: UseWorkspaceRealtimeOptions = {},
) {
  const queryClient = useQueryClient();

  const handleIssueUpdated = useCallback(
    () => {
      void queryClient.invalidateQueries({
        queryKey: ["issues", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["my-work", workspaceId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["project-summary", workspaceId],
      });
    },
    [queryClient, workspaceId],
  );

  useRealtimeChannel({
    topic: buildWorkspaceTopic(workspaceId),
    enabled: enabled && !!workspaceId,
    events: WORKSPACE_REALTIME_EVENTS,
    onBroadcast: handleIssueUpdated,
  });
}
