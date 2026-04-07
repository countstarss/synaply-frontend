import { IssuePriority, IssueStatus, IssueType } from "@/types/prisma";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_DEV_URL || "http://localhost:5678";

// MARK: Issue
export interface IssueStateSummary {
  id?: string;
  name: string;
  color?: string;
}

export interface IssueProject {
  id: string;
  name: string;
  description?: string | null;
  workspaceId?: string;
  visibility?: string;
}

export interface Issue {
  id: string;
  key?: string;
  title: string;
  description?: string;
  workspaceId: string;
  projectId?: string | null;
  directAssigneeId?: string | null;
  creatorId: string;
  stateId?: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
  // 基础属性
  priority?: IssuePriority;

  /**
   * Issue 类型：NORMAL / WORKFLOW
   */
  issueType?: IssueType;

  // 工作流相关字段
  workflowId?: string;
  totalSteps?: number;
  currentStepId?: string;
  currentStepIndex?: number;
  currentStepStatus?: IssueStatus;
  workflowSnapshot?: Record<string, unknown>;
  state?: IssueStateSummary | null;
  project?: IssueProject | null;
}

// MARK: CreateDTO
export interface CreateIssueDto {
  title: string;
  description?: string;
  workspaceId: string;
  projectId?: string;
  directAssigneeId?: string;
  dueDate?: string;
}

export interface IssueQueryParams {
  projectId?: string;
  cursor?: string;
  limit?: number;
}

// MARK: WorkflowIssueDto
export interface CreateWorkflowIssueDto {
  title: string;
  description?: string;
  workspaceId: string;
  dueDate?: string;

  workflowId: string;
  workflowSnapshot: string;
  totalSteps: number;
  currentStepId: string;
  currentStepIndex: number;
  currentStepStatus: IssueStatus;
}

/**
 * 统一的 API 请求函数
 * @param endpoint API 路径
 * @param token Supabase JWT
 * @param options 请求选项 (method, body, etc.)
 * @returns Promise<T>
 */
async function fetchApi<T>(
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
    let message = "API 请求失败";

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

function buildIssueQueryString(params: IssueQueryParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.projectId) searchParams.set("projectId", params.projectId);
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.limit) searchParams.set("limit", `${params.limit}`);

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * 创建新的 Issue (简化版)
 * @param issueData 创建 Issue 所需的数据
 * @param token Supabase JWT
 * @returns Promise<Issue>
 */
export async function createIssue(
  issueData: CreateIssueDto,
  token: string,
): Promise<Issue> {
  const { workspaceId } = issueData;
  return fetchApi<Issue>(
    `/workspaces/${workspaceId}/issues/direct-assignee`,
    token,
    {
      method: "POST",
      body: JSON.stringify(issueData),
    },
  );
}

/**
 * 创建基于工作流的 Issue
 * @param issueData 创建工作流 Issue 所需的数据
 * @param token Supabase JWT
 * @returns Promise<Issue>
 */
export async function createWorkflowIssue(
  issueData: CreateWorkflowIssueDto,
  token: string,
): Promise<Issue> {
  const { workspaceId } = issueData;
  return fetchApi<Issue>(`/workspaces/${workspaceId}/issues/workflow`, token, {
    method: "POST",
    body: JSON.stringify(issueData),
  });
}

/**
 * 获取指定工作空间下的所有 Issue (简化版)
 * @param workspaceId 工作空间 ID
 * @param token Supabase JWT
 * @returns Promise<Issue[]>
 */
export async function getIssues(
  workspaceId: string,
  token: string,
  params: IssueQueryParams = {},
): Promise<Issue[]> {
  const shouldFetchSinglePage =
    params.limit !== undefined || params.cursor !== undefined;

  if (shouldFetchSinglePage) {
    return fetchApi<Issue[]>(
      `/workspaces/${workspaceId}/issues${buildIssueQueryString(params)}`,
      token,
    );
  }

  const pageSize = 100;
  const issues: Issue[] = [];
  let cursor: string | undefined;

  while (true) {
    const page = await fetchApi<Issue[]>(
      `/workspaces/${workspaceId}/issues${buildIssueQueryString({
        ...params,
        limit: pageSize,
        cursor,
      })}`,
      token,
    );

    issues.push(...page);

    if (page.length < pageSize) {
      break;
    }

    cursor = page[page.length - 1]?.id;

    if (!cursor) {
      break;
    }
  }

  return issues;
}

/**
 * 更新 Issue 信息（PATCH 部分字段）
 */
export async function updateIssue(
  workspaceId: string,
  issueId: string,
  data: Partial<Issue>,
  token: string,
): Promise<Issue> {
  return fetchApi<Issue>(
    `/workspaces/${workspaceId}/issues/${issueId}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

/**
 * 删除 Issue
 */
export async function deleteIssue(
  workspaceId: string,
  issueId: string,
  token: string,
): Promise<void> {
  await fetchApi<void>(`/workspaces/${workspaceId}/issues/${issueId}`, token, {
    method: "DELETE",
  });
}

// -------------------- Step Record & Activity --------------------
// MARK: IssueStepRecord
export interface IssueStepRecord {
  id: string;
  issueId: string;
  stepId: string;
  stepName: string;
  index: number;
  resultText?: string;
  attachments?: unknown;
  assigneeId: string;
  createdAt: string;
}
// MARK: StepRecordDto
export interface CreateIssueStepRecordDto {
  stepId: string;
  stepName: string;
  index: number;
  resultText?: string;
  attachments?: unknown;
  assigneeId: string;
}

export async function createIssueStepRecord(
  workspaceId: string,
  issueId: string,
  data: CreateIssueStepRecordDto,
  token: string,
): Promise<IssueStepRecord> {
  return fetchApi<IssueStepRecord>(
    `/workspaces/${workspaceId}/issues/${issueId}/steps`,
    token,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function getIssueStepRecords(
  workspaceId: string,
  issueId: string,
  token: string,
): Promise<IssueStepRecord[]> {
  return fetchApi<IssueStepRecord[]>(
    `/workspaces/${workspaceId}/issues/${issueId}/steps`,
    token,
  );
}

// MARK: IssueActivity
export interface IssueActivity {
  id: string;
  issueId: string;
  actorId: string;
  action: string;
  metadata?: unknown;
  createdAt: string;
}

export interface CreateIssueActivityDto {
  action: string;
  metadata?: unknown;
}

export async function createIssueActivity(
  workspaceId: string,
  issueId: string,
  data: CreateIssueActivityDto,
  token: string,
): Promise<IssueActivity> {
  return fetchApi<IssueActivity>(
    `/workspaces/${workspaceId}/issues/${issueId}/activities`,
    token,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function getIssueActivities(
  workspaceId: string,
  issueId: string,
  token: string,
): Promise<IssueActivity[]> {
  return fetchApi<IssueActivity[]>(
    `/workspaces/${workspaceId}/issues/${issueId}/activities`,
    token,
  );
}
