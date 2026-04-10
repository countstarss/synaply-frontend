"use client";

import React, {
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RiLoader4Line } from "react-icons/ri";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/context/AuthContext";
import { useIssues } from "@/hooks/useIssueApi";
import { useWorkspaceRealtime } from "@/hooks/realtime/useWorkspaceRealtime";
import {
  useCreateProject,
  useDeleteProject,
  useProject,
  useProjectSummary,
  useProjects,
  useUpdateProject,
} from "@/hooks/useProjectApi";
import { useTeamMembers } from "@/hooks/useTeam";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";
import { ProjectRouteShell } from "@/components/projects/ProjectRouteShell";
import {
  ProjectDocsSubview,
  ProjectIssuesSubview,
  ProjectSyncSubview,
  ProjectWorkflowSubview,
} from "@/components/projects/ProjectSubviewContent";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { ProjectsEmptyState } from "@/components/projects/ProjectsEmptyState";
import { ProjectsOverviewPage } from "@/components/projects/ProjectsOverviewPage";
import {
  ProjectEditorDialog,
  type ProjectEditorValues,
} from "@/components/projects/ProjectEditorDialog";
import {
  VISIBILITY_META,
} from "@/components/projects/project-view-utils";
import {
  buildProjectIssuePath,
  buildProjectPath,
  getProjectIssueIdFromPathname,
  getProjectViewModeFromPathname,
  getSelectedProjectIdFromPathname,
} from "@/components/projects/project-route-utils";
import IssueDetailPageSurface from "@/components/issue/IssueDetailPageSurface";
import CreateIssueModal from "@/components/shared/issue/CreateIssueModal";
import {
  isActiveIssue,
  normalizeIssueStateCategoryOrder,
  persistIssueBoardCategoryOrderToStorage,
  readIssueBoardCategoryOrderFromStorage,
} from "@/lib/issue-board";
import type { Issue } from "@/lib/fetchers/issue";
import type {
  Project,
  ProjectDetail,
} from "@/lib/fetchers/project";
import { IssueStateCategory } from "@/types/prisma";

function isSameCategoryOrder(
  left: IssueStateCategory[],
  right: IssueStateCategory[],
) {
  return (
    left.length === right.length &&
    left.every((category, index) => category === right[index])
  );
}

export default function ProjectsPageContent() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isSelectionPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const workspaceId = currentWorkspace?.id || "";
  const workspaceType = currentWorkspace?.type || "PERSONAL";
  const { data: projects = [], isLoading, error, isFetching } =
    useProjects(workspaceId);
  const { data: allIssues = [] } = useIssues(workspaceId);
  const { data: teamMembers = [] } = useTeamMembers(currentWorkspace?.teamId);

  const currentTeamMember = teamMembers.find(
    (member) =>
      member.user?.id === session?.user?.id || member.userId === session?.user?.id,
  );
  const currentRole = currentTeamMember?.role;
  const canManageProjects =
    workspaceType === "PERSONAL" ||
    currentRole === "OWNER" ||
    currentRole === "ADMIN";

  const selectedProjectId = getSelectedProjectIdFromPathname(pathname);
  const selectedProjectIssueId = getProjectIssueIdFromPathname(pathname);
  const projectViewMode = getProjectViewModeFromPathname(pathname);
  useWorkspaceRealtime(workspaceId, {
    enabled: !selectedProjectIssueId,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState<"create" | "edit">(
    "create",
  );
  const [issuesViewMode, setIssuesViewMode] = useState<"list" | "board">("list");
  const [issueBoardCategoryOrder, setIssueBoardCategoryOrder] = useState<
    IssueStateCategory[]
  >(() => readIssueBoardCategoryOrderFromStorage(workspaceId));
  const [savedIssueBoardCategoryOrder, setSavedIssueBoardCategoryOrder] =
    useState<IssueStateCategory[]>(() =>
      readIssueBoardCategoryOrderFromStorage(workspaceId),
    );
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);

  const deferredSearch = useDeferredValue(searchQuery);
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const detailProjectId = isLoading ? "" : selectedProjectId;
  const { data: selectedProjectDetail, isLoading: isLoadingProjectDetail } =
    useProject(workspaceId, detailProjectId);
  const { data: projectSummary, isLoading: isLoadingProjectSummary } =
    useProjectSummary(workspaceId, detailProjectId);
  const { data: projectIssues = [], isLoading: isLoadingProjectIssues } =
    useIssues(
      workspaceId,
      { projectId: selectedProjectId },
      { enabled: !!selectedProjectId },
    );

  useEffect(() => {
    if (!workspaceId || !selectedProjectId || isLoading) {
      return;
    }

    const hasSelection = projects.some(
      (project) => project.id === selectedProjectId,
    );

    if (!hasSelection) {
      router.replace("/projects");
    }
  }, [isLoading, projects, router, selectedProjectId, workspaceId]);

  useEffect(() => {
    const storedOrder = readIssueBoardCategoryOrderFromStorage(workspaceId);

    setIssueBoardCategoryOrder(storedOrder);
    setSavedIssueBoardCategoryOrder(storedOrder);
  }, [workspaceId]);

  const hasUnsavedIssueBoardCategoryOrder = !isSameCategoryOrder(
    savedIssueBoardCategoryOrder,
    issueBoardCategoryOrder,
  );

  const handleIssueBoardCategoryOrderChange = (
    nextOrder: IssueStateCategory[],
  ) => {
    const normalizedOrder = normalizeIssueStateCategoryOrder(nextOrder);

    if (isSameCategoryOrder(issueBoardCategoryOrder, normalizedOrder)) {
      return;
    }

    setIssueBoardCategoryOrder(normalizedOrder);
  };

  const handleSaveIssueBoardCategoryOrder = () => {
    if (!workspaceId) {
      toast.error("当前工作空间无效，无法保存看板顺序");
      return;
    }

    const normalizedOrder = normalizeIssueStateCategoryOrder(
      issueBoardCategoryOrder,
    );

    if (
      isSameCategoryOrder(savedIssueBoardCategoryOrder, normalizedOrder)
    ) {
      toast.message("当前看板顺序没有变化");
      return;
    }

    const didPersist = persistIssueBoardCategoryOrderToStorage(
      workspaceId,
      normalizedOrder,
    );

    if (!didPersist) {
      toast.error("看板类型顺序保存失败，请重试");
      return;
    }

    const persistedOrder = readIssueBoardCategoryOrderFromStorage(workspaceId);

    setIssueBoardCategoryOrder(persistedOrder);
    setSavedIssueBoardCategoryOrder(persistedOrder);
    toast.success("看板类型顺序已更新");
  };

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredProjects = [...projects]
    .filter((project) => {
      if (!normalizedSearch) {
        return true;
      }

      return [
        project.name,
        project.description || "",
        project.brief || "",
        project.phase || "",
        project.status,
        project.riskLevel,
        project.owner?.user?.name || "",
        project.owner?.user?.email || "",
        project.visibility,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );

  const issueCountByProject = allIssues.reduce<Record<string, number>>(
    (counts, issue) => {
      if (!issue.projectId || !isActiveIssue(issue)) {
        return counts;
      }

      counts[issue.projectId] = (counts[issue.projectId] || 0) + 1;
      return counts;
    },
    {},
  );

  const linkedProjectCount = Object.keys(issueCountByProject).length;
  const unassignedIssueCount = allIssues.filter(
    (issue) => !issue.projectId && isActiveIssue(issue),
  ).length;
  const emptyProjectCount = Math.max(projects.length - linkedProjectCount, 0);

  const selectedProject =
    projectSummary?.project ||
    selectedProjectDetail ||
    projects.find((project) => project.id === selectedProjectId) ||
    null;
  const selectedProjectWorkspaceName =
    projectSummary?.project.workspace?.name ||
    selectedProjectDetail?.workspace?.name ||
    currentWorkspace?.name ||
    "";
  const selectedProjectVisibility = selectedProject
    ? VISIBILITY_META[selectedProject.visibility]
    : null;
  const relatedWorkflows = projectSummary?.workflows ?? [];
  const recentActivity = projectSummary?.recentActivity ?? [];

  const openCreateDialog = () => {
    setProjectDialogMode("create");
    setEditingProject(null);
    setIsProjectDialogOpen(true);
  };

  const openEditDialog = (project: Project | ProjectDetail) => {
    setProjectDialogMode("edit");
    setEditingProject(project);
    setIsProjectDialogOpen(true);
  };

  const handleProjectSubmit = async (values: ProjectEditorValues) => {
    if (!workspaceId) {
      toast.error("请先选择工作空间");
      return;
    }

    try {
      if (projectDialogMode === "create") {
        const createdProject = await createProjectMutation.mutateAsync({
          workspaceId,
          data: values,
        });

        startTransition(() => {
          router.push(buildProjectPath(createdProject.id));
        });
        toast.success("项目创建成功");
      } else if (editingProject) {
        const updatedProject = await updateProjectMutation.mutateAsync({
          workspaceId,
          projectId: editingProject.id,
          data: values,
        });

        startTransition(() => {
          router.push(buildProjectPath(updatedProject.id));
        });
        toast.success("项目已更新");
      }

      setIsProjectDialogOpen(false);
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "保存项目失败",
      );
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!workspaceId) {
      toast.error("请先选择工作空间");
      return;
    }

    try {
      const deletedResult = await deleteProjectMutation.mutateAsync({
        workspaceId,
        projectId: project.id,
      });

      startTransition(() => {
        if (project.id === selectedProjectId) {
          router.push("/projects");
        }
      });
      setProjectToDelete(null);
      toast.success(
        `项目已删除，同时删除了 ${deletedResult.deletedIssueCount} 个相关任务`,
      );
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "删除项目失败",
      );
    }
  };

  const handleOpenIssue = (issue: Issue) => {
    const projectIdForRoute = selectedProjectId || issue.projectId;

    if (!projectIdForRoute) {
      toast.error("当前项目路径无效，无法打开任务");
      return;
    }

    startTransition(() => {
      router.push(buildProjectIssuePath(projectIdForRoute, issue.id));
    });
  };

  const invalidateIssues = () => {
    queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
  };

  const handleMarkSync = (projectId: string) => {
    updateProjectMutation.mutate(
      {
        workspaceId,
        projectId,
        data: {
          lastSyncAt: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success("项目同步时间已更新");
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : "更新项目同步时间失败",
          );
        },
      },
    );
  };

  if (!workspaceId) {
    return (
      <div className="flex h-full items-center justify-center bg-app-bg">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-app-text-primary">
            暂无工作空间
          </h2>
          <p className="mt-2 text-sm text-app-text-secondary">
            选择一个 workspace 后，项目模块会自动按对应空间隔离数据。
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-app-bg">
        <div className="flex items-center gap-2 text-app-text-secondary">
          <RiLoader4Line className="size-5 animate-spin" />
          正在加载项目...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-app-bg">
        <div className="max-w-md text-center">
          <h2 className="text-lg font-semibold text-app-text-primary">
            项目加载失败
          </h2>
          <p className="mt-2 text-sm leading-6 text-app-text-secondary">
            {error.message || "获取项目列表失败"}
          </p>
        </div>
      </div>
    );
  }

  if (selectedProjectId && selectedProjectIssueId) {
    return (
      <div className="h-full w-full bg-transparent">
        <IssueDetailPageSurface
          issueId={selectedProjectIssueId}
          workspaceId={workspaceId}
          onClose={() => router.push(buildProjectPath(selectedProjectId, "issues"))}
          onUpdate={invalidateIssues}
        />
      </div>
    );
  }

  return (
    <>
      <div
        className="flex h-full min-h-0 flex-col bg-app-bg"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, rgba(56, 189, 248, 0.08), transparent 28%)",
        }}
      >
        {!projects.length ? (
          <ProjectsEmptyState
            canManageProjects={canManageProjects}
            onCreate={openCreateDialog}
          />
        ) : !selectedProject ? (
          <ProjectsOverviewPage
            workspaceType={workspaceType}
            projects={projects}
            filteredProjects={filteredProjects}
            issueCountByProject={issueCountByProject}
            linkedProjectCount={linkedProjectCount}
            emptyProjectCount={emptyProjectCount}
            unassignedIssueCount={unassignedIssueCount}
            canManageProjects={canManageProjects}
            isFetching={isFetching}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreate={openCreateDialog}
            onOpenProject={(projectId) =>
              startTransition(() => {
                router.push(buildProjectPath(projectId));
              })
            }
          />
        ) : (
          <ProjectRouteShell
            project={selectedProject}
            activeView={projectViewMode}
          >
            {projectViewMode === "issues" ? (
              <ProjectIssuesSubview
                workspaceId={workspaceId}
                projectIssues={projectIssues}
                issuesViewMode={issuesViewMode}
                issueBoardCategoryOrder={issueBoardCategoryOrder}
                isLoadingProjectIssues={isLoadingProjectIssues}
                hasUnsavedIssueBoardCategoryOrder={
                  hasUnsavedIssueBoardCategoryOrder
                }
                currentTeamMemberId={currentTeamMember?.id}
                onCreateIssue={() => setIsCreateIssueOpen(true)}
                onOpenIssue={handleOpenIssue}
                onIssueBoardCategoryOrderChange={
                  handleIssueBoardCategoryOrderChange
                }
                onSaveIssueBoardCategoryOrder={
                  handleSaveIssueBoardCategoryOrder
                }
                onIssuesViewModeChange={setIssuesViewMode}
              />
            ) : projectViewMode === "docs" ? (
              <ProjectDocsSubview
                workspaceId={workspaceId}
                workspaceType={workspaceType}
                currentUserId={session?.user?.id}
                projectId={selectedProject.id}
              />
            ) : projectViewMode === "workflow" ? (
              <ProjectWorkflowSubview relatedWorkflows={relatedWorkflows} />
            ) : projectViewMode === "sync" ? (
              <ProjectSyncSubview
                selectedProject={selectedProject}
                recentActivity={recentActivity}
                projectIssues={projectIssues}
                onMarkSync={() => handleMarkSync(selectedProject.id)}
                isMarkingSync={updateProjectMutation.isPending}
                onOpenIssue={handleOpenIssue}
              />
            ) : (
              <ProjectDetailView
                workspaceId={workspaceId}
                selectedProject={selectedProject}
                workspaceType={workspaceType}
                workspaceName={selectedProjectWorkspaceName}
                visibilityLabel={
                  selectedProjectVisibility?.label || selectedProject.visibility
                }
                currentUserId={session?.user?.id}
                projectSummary={projectSummary}
                projectIssues={projectIssues}
                isSelectionPending={isSelectionPending}
                isLoadingProjectDetail={
                  isLoadingProjectDetail || isLoadingProjectSummary
                }
                canManageProjects={canManageProjects}
                onBack={() => router.push("/projects")}
                onCreateIssue={() => setIsCreateIssueOpen(true)}
                onEdit={() => openEditDialog(selectedProject)}
                onDelete={() => setProjectToDelete(selectedProject)}
                onOpenIssue={handleOpenIssue}
                onMarkSync={() => handleMarkSync(selectedProject.id)}
                isMarkingSync={updateProjectMutation.isPending}
                showBackButton={false}
              />
            )}
          </ProjectRouteShell>
        )}
      </div>

      <ProjectEditorDialog
        open={isProjectDialogOpen}
        mode={projectDialogMode}
        workspaceType={workspaceType}
        initialProject={editingProject}
        teamMembers={teamMembers}
        defaultOwnerMemberId={currentTeamMember?.id}
        isPending={
          createProjectMutation.isPending || updateProjectMutation.isPending
        }
        onOpenChange={setIsProjectDialogOpen}
        onSubmit={handleProjectSubmit}
      />

      <DeleteProjectDialog
        open={!!projectToDelete}
        workspaceId={workspaceId}
        project={projectToDelete}
        isDeleting={deleteProjectMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setProjectToDelete(null);
          }
        }}
        onConfirm={handleDeleteProject}
      />

      <CreateIssueModal
        isOpen={isCreateIssueOpen}
        onClose={() => setIsCreateIssueOpen(false)}
        onCreated={() => {
          invalidateIssues();
          setIsCreateIssueOpen(false);
        }}
        initialProjectId={selectedProject?.id}
        projectContextName={selectedProject?.name}
      />

    </>
  );
}
