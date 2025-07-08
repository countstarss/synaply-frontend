import { Issue } from "@/types/team";
import { Api, CreateIssueDto } from "@/api";
import {
  Issue as PrismaIssue,
  VisibilityType,
  // Comment,
  // IssueDependency,
} from "@/types/prisma";
import {
  prismaToTeamIssue,
  teamToPrismaIssue,
} from "@/lib/adapters/typeAdapters";

// 创建API实例
const createApi = (token: string) => {
  const api = new Api({
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || "",
    securityWorker: () => ({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  });
  api.setSecurityData(token);
  return api;
};

/**
 * 创建普通Issue
 */
export async function createIssue(
  issue: Partial<Issue>,
  token: string,
  workspaceId: string
): Promise<Issue> {
  const api = createApi(token);
  const backendIssue = teamToPrismaIssue(issue);

  const issueData: CreateIssueDto = {
    title: backendIssue.title || "无标题",
    description: backendIssue.description || "",
    workspaceId,
    projectId: backendIssue.projectId || undefined,
    status: backendIssue.status,
    priority: backendIssue.priority,
    directAssigneeId: backendIssue.directAssigneeId || undefined,
    dueDate: backendIssue.dueDate || undefined,
    startDate: undefined, // 使用后端默认值
    visibility: VisibilityType.PRIVATE, // 默认私有
  };

  const response = await api.workspaces.issueControllerCreate(
    workspaceId,
    issueData
  );

  if (!response.ok) {
    throw new Error("创建Issue失败");
  }

  return prismaToTeamIssue(response.data! as PrismaIssue);
}

/**
 * 创建工作流Issue
 */
export async function createWorkflowIssue(
  issue: Partial<Issue>,
  workflowId: string,
  token: string,
  workspaceId: string
): Promise<Issue> {
  const api = createApi(token);
  const backendIssue = teamToPrismaIssue(issue);

  const issueData: CreateIssueDto = {
    title: backendIssue.title || "无标题",
    description: backendIssue.description || "",
    workspaceId,
    projectId: backendIssue.projectId || undefined,
    workflowId,
    currentStepId: backendIssue.currentStepId || undefined,
    status: backendIssue.status,
    priority: backendIssue.priority,
    directAssigneeId: backendIssue.directAssigneeId || undefined,
    dueDate: backendIssue.dueDate || undefined,
    startDate: undefined, // 使用后端默认值
    visibility: VisibilityType.PRIVATE, // 默认私有
  };

  const response = await api.workspaces.issueControllerCreate(
    workspaceId,
    issueData
  );

  if (!response.ok) {
    throw new Error("创建工作流Issue失败");
  }

  return prismaToTeamIssue(response.data! as PrismaIssue);
}

/**
 * 获取Issue列表
 */
export async function fetchIssues(
  token: string,
  workspaceId: string,
  projectId?: string
): Promise<Issue[]> {
  const api = createApi(token);
  const response = await api.workspaces.issueControllerFindAll(
    workspaceId,
    projectId ? { projectId } : ({} as { projectId: string })
  );

  if (!response.ok) {
    return [];
  }

  const issues = response.data! as PrismaIssue[];
  return issues.map((issue) => prismaToTeamIssue(issue));
}
