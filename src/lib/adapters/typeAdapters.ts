import {
  Issue as PrismaIssue,
  IssueStatus,
  IssuePriority,
  Workflow as PrismaWorkflow,
  WorkflowStatus,
  IssueActivity as PrismaIssueActivity,
} from "@/types/prisma";

import {
  Issue as TeamIssue,
  Workflow as TeamWorkflow,
  WorkflowIssue,
  WorkflowNode,
} from "@/types/team";

/**
 * MARK: Iss:Prisma-Team
 *  - Issue
 */
export function prismaToTeamIssue(prismaIssue: PrismaIssue): TeamIssue {
  return {
    id: prismaIssue.id,
    title: prismaIssue.title,
    description: prismaIssue.description || "",
    status: mapPrismaStatusToTeam(prismaIssue.status),
    priority: mapPrismaPriorityToTeam(prismaIssue.priority),
    assignee:
      prismaIssue.directAssigneeId ||
      prismaIssue.currentAssigneeId ||
      undefined,
    project: prismaIssue.projectId || undefined,
    createdAt: prismaIssue.createdAt,
    updatedAt: prismaIssue.updatedAt,
    type: prismaIssue.workflowId ? "workflow" : "normal",
    workflowData:
      prismaIssue.workflowId && prismaIssue.workflowSnapshot
        ? createWorkflowIssueFromSnapshot(
            prismaIssue.id,
            prismaIssue.title,
            prismaIssue.description || "",
            prismaIssue.workflowId,
            prismaIssue.workflow?.name || "未命名工作流",
            mapPrismaStatusToTeam(prismaIssue.status),
            mapPrismaPriorityToTeam(prismaIssue.priority),
            prismaIssue.directAssigneeId || prismaIssue.currentAssigneeId,
            prismaIssue.projectId,
            prismaIssue.createdAt,
            prismaIssue.updatedAt,
            prismaIssue.dueDate,
            prismaIssue.currentStepId,
            prismaIssue.workflowSnapshot as Record<string, unknown>,
            prismaIssue.activities || []
          )
        : undefined,
  };
}

/**
 * MARK: Iss:Team-Prisma
 */
export function teamToPrismaIssue(
  issue: Partial<TeamIssue> | TeamIssue
): Partial<PrismaIssue> {
  return {
    title: issue.title,
    description: issue.description,
    status: mapTeamStatusToPrisma(issue.status),
    priority: mapTeamPriorityToPrisma(issue.priority),
    directAssigneeId: issue.assignee,
    projectId: issue.project,
    workflowId: issue.workflowData?.workflowId,
    currentStepId: issue.workflowData?.currentNodeId,
    dueDate: issue.workflowData?.deadline,
    // 如果是工作流类型，设置工作流相关字段
    ...(issue.type === "workflow"
      ? {
          workflowCompleted: false,
          workflowCurrentStepIndex: 0,
          currentAssigneeId: issue.assignee,
        }
      : {}),
  };
}

/**
 * MARK: Flow:Pris-Team
 */
export function prismaToTeamWorkflow(
  prismaWorkflow: PrismaWorkflow
): TeamWorkflow {
  const workflowJson = prismaWorkflow.json
    ? typeof prismaWorkflow.json === "string"
      ? JSON.parse(prismaWorkflow.json as string)
      : (prismaWorkflow.json as Record<string, unknown>)
    : { nodes: [], edges: [] };

  return {
    id: prismaWorkflow.id,
    name: prismaWorkflow.name,
    description: "",
    nodes: workflowJson.nodes || [],
    edges: workflowJson.edges || [],
    createdAt: prismaWorkflow.createdAt,
    updatedAt: prismaWorkflow.updatedAt,
    createdBy: prismaWorkflow.creatorId,
    tags: [],
    isDraft: prismaWorkflow.status === WorkflowStatus.DRAFT,
    version: prismaWorkflow.version,
    assigneeMap: (prismaWorkflow.assigneeMap as Record<string, string>) || {},
    totalSteps: prismaWorkflow.totalSteps,
  };
}

/**
 * 将前端Team Workflow类型转换为后端Prisma Workflow类型
 */
export function teamToPrismaWorkflow(
  teamWorkflow: TeamWorkflow
): Partial<PrismaWorkflow> {
  return {
    name: teamWorkflow.name,
    status: teamWorkflow.isDraft
      ? WorkflowStatus.DRAFT
      : WorkflowStatus.PUBLISHED,
    json: JSON.stringify({
      nodes: teamWorkflow.nodes,
      edges: teamWorkflow.edges,
    }),
    assigneeMap: teamWorkflow.assigneeMap || {},
    totalSteps: teamWorkflow.nodes.length,
    currentStepIndex: 0,
    currentStepStatus: IssueStatus.TODO,
    version: teamWorkflow.version || "v1",
  };
}

/**
 * MARK: 快照->WorkflowIssue
 */
function createWorkflowIssueFromSnapshot(
  id: string,
  title: string,
  description: string,
  workflowId: string,
  workflowName: string,
  status: "todo" | "in_progress" | "done" | "canceled",
  priority: "urgent" | "high" | "medium" | "low",
  assignee?: string | null,
  project?: string | null,
  createdAt?: string,
  updatedAt?: string,
  deadline?: string | null,
  currentNodeId?: string | null,
  snapshot?: Record<string, unknown>,
  activities?: PrismaIssueActivity[]
): WorkflowIssue {
  // 从快照中提取节点状态
  const nodeStatuses: WorkflowIssue["nodeStatuses"] = {};

  if (snapshot && Array.isArray(snapshot.nodes)) {
    (snapshot.nodes as WorkflowNode[]).forEach((node: WorkflowNode) => {
      nodeStatuses[node.id] = {
        status: node.data.status || "todo",
        assignee: node.data.assignee,
      };
    });
  }

  // 从活动记录中创建历史
  const history =
    activities?.map((activity) => ({
      timestamp: activity.createdAt,
      action: activity.toStepName,
      nodeId: activity.fromStepName || undefined,
      fromUser: activity.actor?.user?.name || activity.actorId,
      comment: activity.comment || undefined,
    })) || [];

  return {
    id,
    title,
    description,
    workflowId,
    workflowName,
    status,
    priority,
    assignee: assignee || undefined,
    project: project || undefined,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: updatedAt || new Date().toISOString(),
    deadline: deadline || undefined,
    currentNodeId: currentNodeId || undefined,
    nodeStatuses,
    history,
  };
}

/**
 * MARK: 状态映射函数-1
 *  - Prisma到Team
 */
export function mapPrismaStatusToTeam(
  status: IssueStatus
): "todo" | "in_progress" | "done" | "canceled" {
  switch (status) {
    case IssueStatus.TODO:
      return "todo";
    case IssueStatus.IN_PROGRESS:
      return "in_progress";
    case IssueStatus.DONE:
      return "done";
    case IssueStatus.BLOCKED:
      return "canceled";
    default:
      return "todo";
  }
}

/**
 * MARK: 状态映射函数-2
 *  - Team到Prisma
 */
export function mapTeamStatusToPrisma(status?: string): IssueStatus {
  switch (status) {
    case "todo":
      return IssueStatus.TODO;
    case "in_progress":
      return IssueStatus.IN_PROGRESS;
    case "done":
      return IssueStatus.DONE;
    case "canceled":
      return IssueStatus.BLOCKED;
    default:
      return IssueStatus.TODO;
  }
}

/**
 * MARK: 优先级映射函数-1
 *  - Prisma到Team
 */
export function mapPrismaPriorityToTeam(
  priority: IssuePriority
): "urgent" | "high" | "medium" | "low" {
  switch (priority) {
    case IssuePriority.URGENT:
      return "urgent";
    case IssuePriority.HIGH:
      return "high";
    case IssuePriority.NORMAL:
      return "medium";
    case IssuePriority.LOW:
      return "low";
    default:
      return "medium";
  }
}

/**
 * MARK: 优先级映射函数-2
 *  - Team到Prisma
 */
export function mapTeamPriorityToPrisma(priority?: string): IssuePriority {
  switch (priority) {
    case "urgent":
      return IssuePriority.URGENT;
    case "high":
      return IssuePriority.HIGH;
    case "medium":
      return IssuePriority.NORMAL;
    case "low":
      return IssuePriority.LOW;
    default:
      return IssuePriority.NORMAL;
  }
}
