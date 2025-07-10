// MARK: Issue
export interface Issue {
  id: string;
  title: string;
  description?: string | null;
  workspaceId: string;
  directAssigneeId?: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
}

// MARK: CreateDTO
export interface CreateIssueDto {
  title: string;
  description?: string;
  workspaceId: string;
  directAssigneeId?: string;
  dueDate?: string;
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
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`http://localhost:5678${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "API 请求失败");
  }

  // 对于 204 No Content，直接返回 null
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

/**
 * 创建新的 Issue (简化版)
 * @param issueData 创建 Issue 所需的数据
 * @param token Supabase JWT
 * @returns Promise<Issue>
 */
export async function createIssue(
  issueData: CreateIssueDto,
  token: string
): Promise<Issue> {
  const { workspaceId } = issueData;
  return fetchApi<Issue>(`/workspaces/${workspaceId}/issues`, token, {
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
  token: string
): Promise<Issue[]> {
  return fetchApi<Issue[]>(`/workspaces/${workspaceId}/issues`, token);
}
