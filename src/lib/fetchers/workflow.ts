import { CreateWorkflowDto, UpdateWorkflowDto } from "@/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_DEV_URL || "http://localhost:5678";

export interface WorkflowResponse {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  creatorId: string;
  visibility: string;
  assigneeMap?: Record<string, string>;
  json?: string;
  totalSteps: number;
  currentStepIndex: number;
  currentStepStatus: string;
  isSystemTemplate: boolean;
  version: string;
  creator?: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  };
}

/**
 * 获取工作流列表
 */
export const fetchWorkflows = async (
  workspaceId: string,
  token: string
): Promise<WorkflowResponse[]> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("获取工作流列表失败");
  }

  return response.json();
};

/**
 * 获取工作流详情
 */
export const fetchWorkflowById = async (
  workspaceId: string,
  workflowId: string,
  token: string
): Promise<WorkflowResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows/${workflowId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("获取工作流详情失败");
  }

  return response.json();
};

/**
 * 创建工作流
 */
export const createWorkflow = async (
  workspaceId: string,
  data: CreateWorkflowDto,
  token: string
): Promise<WorkflowResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("创建工作流失败");
  }

  return response.json();
};

/**
 * 更新工作流
 */
export const updateWorkflow = async (
  workspaceId: string,
  workflowId: string,
  data: UpdateWorkflowDto,
  token: string
): Promise<WorkflowResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows/${workflowId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error("更新工作流失败");
  }

  return response.json();
};

/**
 * 删除工作流
 */
export const deleteWorkflow = async (
  workspaceId: string,
  workflowId: string,
  token: string
): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows/${workflowId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("删除工作流失败");
  }
};

/**
 * 发布工作流
 */
export const publishWorkflow = async (
  workspaceId: string,
  workflowId: string,
  token: string
): Promise<WorkflowResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows/${workflowId}/publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("发布工作流失败");
  }

  return response.json();
};

/**
 * 更新工作流JSON数据（包含节点和边的信息）
 */
export const updateWorkflowJson = async (
  workspaceId: string,
  workflowId: string,
  workflowData: {
    nodes: unknown[];
    edges: unknown[];
    assigneeMap?: Record<string, string>;
  },
  token: string
): Promise<WorkflowResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/workflows/${workflowId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        json: JSON.stringify(workflowData),
        totalSteps: workflowData.nodes.length,
        assigneeMap: workflowData.assigneeMap,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("更新工作流数据失败");
  }

  return response.json();
};