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
import { useAuth } from "@/context/AuthContext";
import { useIssues } from "@/hooks/useIssueApi";
import {
  useCreateProject,
  useDeleteProject,
  useProject,
  useProjects,
  useUpdateProject,
} from "@/hooks/useProjectApi";
import { useTeamMembers } from "@/hooks/useTeam";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";
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
import WorkflowIssueDetail from "@/components/issue/WorkflowIssueDetail";
import NormalIssueDetail from "@/components/shared/issue/NormalIssueDetail";
import CreateIssueModal from "@/components/shared/issue/CreateIssueModal";
import { isWorkflowIssue, type Issue } from "@/lib/fetchers/issue";
import type { Project, ProjectDetail } from "@/lib/fetchers/project";

export default function ProjectsPageContent() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [isSelectionPending, startTransition] = useTransition();
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

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [projectDialogMode, setProjectDialogMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isWorkflowIssueOpen, setIsWorkflowIssueOpen] = useState(false);
  const [isNormalIssueOpen, setIsNormalIssueOpen] = useState(false);
  const selectedIssueIsWorkflow = selectedIssue
    ? isWorkflowIssue(selectedIssue)
    : false;

  const deferredSearch = useDeferredValue(searchQuery);
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const { data: selectedProjectDetail, isLoading: isLoadingProjectDetail } =
    useProject(workspaceId, selectedProjectId);
  const { data: projectIssues = [], isLoading: isLoadingProjectIssues } =
    useIssues(
      workspaceId,
      { projectId: selectedProjectId },
      { enabled: !!selectedProjectId },
    );

  useEffect(() => {
    if (!projects.length || !selectedProjectId) {
      return;
    }

    const hasSelection = projects.some(
      (project) => project.id === selectedProjectId,
    );

    if (!hasSelection) {
      setSelectedProjectId("");
    }
  }, [projects, selectedProjectId]);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredProjects = [...projects]
    .filter((project) => {
      if (!normalizedSearch) {
        return true;
      }

      return [project.name, project.description || "", project.visibility]
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
      if (!issue.projectId) {
        return counts;
      }

      counts[issue.projectId] = (counts[issue.projectId] || 0) + 1;
      return counts;
    },
    {},
  );

  const linkedProjectCount = Object.keys(issueCountByProject).length;
  const unassignedIssueCount = allIssues.filter(
    (issue) => !issue.projectId,
  ).length;
  const emptyProjectCount = Math.max(projects.length - linkedProjectCount, 0);

  const selectedProject =
    selectedProjectDetail ||
    projects.find((project) => project.id === selectedProjectId) ||
    null;
  const selectedProjectWorkspaceName =
    selectedProjectDetail?.workspace?.name || currentWorkspace?.name || "";
  const selectedProjectVisibility = selectedProject
    ? VISIBILITY_META[selectedProject.visibility]
    : null;

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
          setSelectedProjectId(createdProject.id);
        });
        toast.success("项目创建成功");
      } else if (editingProject) {
        const updatedProject = await updateProjectMutation.mutateAsync({
          workspaceId,
          projectId: editingProject.id,
          data: values,
        });

        startTransition(() => {
          setSelectedProjectId(updatedProject.id);
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
        setSelectedProjectId(
          project.id === selectedProjectId ? "" : selectedProjectId,
        );
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
    setSelectedIssue(issue);

    if (isWorkflowIssue(issue)) {
      setIsWorkflowIssueOpen(true);
      return;
    }

    setIsNormalIssueOpen(true);
  };

  const invalidateIssues = () => {
    queryClient.invalidateQueries({ queryKey: ["issues", workspaceId] });
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
                setSelectedProjectId(projectId);
              })
            }
          />
        ) : (
          <ProjectDetailView
            selectedProject={selectedProject}
            workspaceName={selectedProjectWorkspaceName}
            visibilityLabel={
              selectedProjectVisibility?.label || selectedProject.visibility
            }
            projectIssues={projectIssues}
            isSelectionPending={isSelectionPending}
            isLoadingProjectDetail={isLoadingProjectDetail}
            isLoadingProjectIssues={isLoadingProjectIssues}
            canManageProjects={canManageProjects}
            onBack={() => setSelectedProjectId("")}
            onCreateIssue={() => setIsCreateIssueOpen(true)}
            onEdit={() => openEditDialog(selectedProject)}
            onDelete={() => setProjectToDelete(selectedProject)}
            onOpenIssue={handleOpenIssue}
          />
        )}
      </div>

      <ProjectEditorDialog
        open={isProjectDialogOpen}
        mode={projectDialogMode}
        workspaceType={workspaceType}
        initialProject={editingProject}
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

      {selectedIssue && (
        <>
          <WorkflowIssueDetail
            issue={selectedIssue}
            isOpen={selectedIssueIsWorkflow && isWorkflowIssueOpen}
            onClose={() => {
              setSelectedIssue(null);
              setIsWorkflowIssueOpen(false);
            }}
            onUpdate={invalidateIssues}
          />

          <NormalIssueDetail
            issue={selectedIssue}
            isOpen={!selectedIssueIsWorkflow && isNormalIssueOpen}
            onClose={() => {
              setSelectedIssue(null);
              setIsNormalIssueOpen(false);
            }}
            onUpdate={(updatedIssue) => {
              void updatedIssue;
              invalidateIssues();
            }}
          />
        </>
      )}
    </>
  );
}
