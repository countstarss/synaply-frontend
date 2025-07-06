"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  fetchUserTeams,
  createTeam,
  CreateTeamData,
} from "@/lib/fetchers/team";

export const useTeam = () => {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  // MARK: - 获取用户所有团队
  const {
    data: teams,
    isLoading: isLoadingTeams,
    error: teamsError,
  } = useQuery({
    queryKey: ["teams"],
    queryFn: () => fetchUserTeams(session!.access_token),
    enabled: !!session?.access_token,
  });

  // MARK: - 创建团队
  const createTeamMutation = useMutation({
    mutationFn: (data: CreateTeamData) =>
      createTeam(data, session!.access_token),
    onSuccess: () => {
      // 成功后重新获取团队列表
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  // MARK: - 当前用户团队状态
  const hasTeams = teams && teams.length > 0;
  const hasOnlyOneTeam = teams && teams.length === 1;
  const currentTeam = hasOnlyOneTeam ? teams[0] : null;

  // MARK: -获取当前团队成员信息;
  // const currentTeamMember =
  //   currentTeam && session?.user?.id
  //     ? currentTeam.members.find((member) => member.user.id === session.user.id)
  //     : null;

  return {
    teams,
    isLoadingTeams,
    teamsError,
    createTeam: createTeamMutation.mutateAsync,
    isCreatingTeam: createTeamMutation.isPending,
    createTeamError: createTeamMutation.error,
    hasTeams,
    hasOnlyOneTeam,
    currentTeam,
    // currentTeamMember,
  };
};
