"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  fetchUserTeams,
  createTeam,
  CreateTeamData,
  fetchTeamMembers,
  fetchTeamById,
  Team,
  TeamMember,
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

/**
 * 获取当前用户的主团队（第一个团队）
 */
export const useCurrentTeam = () => {
  const { teams, isLoadingTeams, teamsError } = useTeam();

  return {
    team: teams?.[0] || null,
    isLoading: isLoadingTeams,
    error: teamsError,
  };
};

/**
 * 获取团队成员列表
 */
export const useTeamMembers = (teamId: string | undefined) => {
  const { session } = useAuth();

  return useQuery<TeamMember[]>({
    queryKey: ["team-members", teamId],
    queryFn: () => fetchTeamMembers(teamId!, session?.access_token || ""),
    enabled: !!session?.access_token && !!teamId,
    staleTime: 2 * 60 * 1000, // 2分钟内认为数据新鲜
    retry: 2,
  });
};

/**
 * 获取团队详情
 */
export const useTeamById = (teamId: string | undefined) => {
  const { session } = useAuth();

  return useQuery<Team>({
    queryKey: ["team", teamId],
    queryFn: () => fetchTeamById(teamId!, session?.access_token || ""),
    enabled: !!session?.access_token && !!teamId,
    staleTime: 5 * 60 * 1000, // 5分钟内认为数据新鲜
    retry: 2,
  });
};
