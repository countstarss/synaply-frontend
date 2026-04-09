"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchMyWork } from "@/lib/fetchers/my-work";

export function useMyWork(workspaceId: string) {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["my-work", workspaceId],
    queryFn: () => fetchMyWork(workspaceId, session!.access_token),
    enabled: !!workspaceId && !!session?.access_token,
    staleTime: 30_000,
  });
}
