const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_DEV_URL || "http://localhost:5678";

export type ProjectVisibility =
  | "PRIVATE"
  | "TEAM_READONLY"
  | "TEAM_EDITABLE"
  | "PUBLIC";

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  workspaceId: string;
  creatorId: string;
  visibility: ProjectVisibility;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends Project {
  workspace?: {
    id: string;
    name: string;
    type: "PERSONAL" | "TEAM";
  };
}

export interface DeleteProjectResult extends Project {
  deletedIssueCount: number;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  visibility?: ProjectVisibility;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  visibility?: ProjectVisibility;
}

export const PROJECT_VISIBILITY_OPTIONS: Array<{
  value: ProjectVisibility;
  label: string;
  description: string;
}> = [
  {
    value: "PRIVATE",
    label: "Private",
    description: "仅当前 workspace 负责人或可访问成员可见",
  },
  {
    value: "TEAM_READONLY",
    label: "Team Readonly",
    description: "团队成员可读，不可改动项目本身",
  },
  {
    value: "TEAM_EDITABLE",
    label: "Team Editable",
    description: "团队内协作编辑，适合共享推进中的项目",
  },
  {
    value: "PUBLIC",
    label: "Public",
    description: "公开可见，适合对外共享的项目说明",
  },
];

export function getDefaultProjectVisibility(
  workspaceType: "PERSONAL" | "TEAM",
): ProjectVisibility {
  return workspaceType === "TEAM" ? "TEAM_READONLY" : "PRIVATE";
}

async function fetchProjectApi<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = "项目请求失败";

    try {
      const errorData = await response.json();
      message =
        errorData?.message ||
        errorData?.error ||
        (typeof errorData === "string" ? errorData : message);
    } catch {
      const errorText = await response.text().catch(() => "");
      message = errorText || message;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export async function getProjects(
  workspaceId: string,
  token: string,
): Promise<Project[]> {
  return fetchProjectApi<Project[]>(`/workspaces/${workspaceId}/projects`, token);
}

export async function getProject(
  workspaceId: string,
  projectId: string,
  token: string,
): Promise<ProjectDetail> {
  return fetchProjectApi<ProjectDetail>(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    token,
  );
}

export async function createProject(
  workspaceId: string,
  data: CreateProjectDto,
  token: string,
): Promise<Project> {
  return fetchProjectApi<Project>(`/workspaces/${workspaceId}/projects`, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProject(
  workspaceId: string,
  projectId: string,
  data: UpdateProjectDto,
  token: string,
): Promise<Project> {
  return fetchProjectApi<Project>(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

export async function deleteProject(
  workspaceId: string,
  projectId: string,
  token: string,
): Promise<DeleteProjectResult> {
  return fetchProjectApi<DeleteProjectResult>(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    token,
    {
      method: "DELETE",
    },
  );
}
