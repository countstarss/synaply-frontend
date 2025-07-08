// 从Prisma schema生成的前端类型定义

// MARK: 角色
export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

// MARK: 工作空间类型
export enum WorkspaceType {
  PERSONAL = "PERSONAL",
  TEAM = "TEAM",
}

// MARK: 工作流状态
export enum WorkflowStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
}

// MARK: 任务状态
export enum IssueStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  BLOCKED = "BLOCKED",
  DONE = "DONE",
}

// MARK: 任务优先级
export enum IssuePriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

// MARK: 可见权限
export enum VisibilityType {
  PRIVATE = "PRIVATE",
  TEAM_READONLY = "TEAM_READONLY",
  TEAM_EDITABLE = "TEAM_EDITABLE",
  PUBLIC = "PUBLIC",
}

// MARK: 用户
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// MARK: 团队
export interface Team {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  members?: TeamMember[];
  workspace?: Workspace;
}

// MARK: 团队成员
export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  user?: User;
  team?: Team;
}

// MARK: 工作空间
export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  userId: string | null;
  teamId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  team?: Team;
}

// MARK: 项目
export interface Project {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  visibility: VisibilityType;
  creator?: TeamMember;
  workspace?: Workspace;
}

// MARK: 工作流
export interface Workflow {
  id: string;
  name: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  status: WorkflowStatus;
  creatorId: string;
  visibility: VisibilityType;
  assigneeMap?: Record<string, string>;
  json?: string;
  totalSteps: number;
  currentStepIndex: number;
  currentStepStatus: IssueStatus;
  isSystemTemplate: boolean;
  version: string;
  creator?: TeamMember;
  workspace?: Workspace;
}

// MARK: 任务
export interface Issue {
  id: string;
  title: string;
  description: string | null;
  workspaceId: string;
  workflowId: string | null;
  directAssigneeId: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  parentTaskId: string | null;
  priority: IssuePriority;
  startDate: string | null;
  status: IssueStatus;
  projectId: string | null;
  visibility: VisibilityType;
  currentStepId: string | null;
  workflowSnapshot?: Record<string, unknown>;
  workflowCompleted: boolean;
  workflowCurrentStepIndex: number;
  currentAssigneeId: string | null;
  creator?: TeamMember;
  directAssignee?: TeamMember;
  currentAssignee?: TeamMember;
  parentTask?: Issue;
  subtasks?: Issue[];
  project?: Project;
  workflow?: Workflow;
  workspace?: Workspace;
  comments?: Comment[];
  activities?: IssueActivity[];
}

// MARK: 任务活动
export interface IssueActivity {
  id: string;
  issueId: string;
  actorId: string;
  fromStepName: string | null;
  toStepName: string;
  comment: string | null;
  createdAt: string;
  actor?: TeamMember;
  issue?: Issue;
}

// MARK: 评论
export interface Comment {
  id: string;
  content: string;
  issueId: string;
  authorId: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: TeamMember;
  issue?: Issue;
}

// MARK: 任务依赖
export interface IssueDependency {
  id: string;
  blockerIssueId: string;
  dependsOnIssueId: string;
  createdAt: string;
  blockerIssue?: Issue;
  dependsOnIssue?: Issue;
}

// MARK: 任务进度日志
export interface IssueProgressLog {
  id: string;
  issueId: string;
  stepId: string;
  stepName: string;
  fromStatus: string | null;
  toStatus: string;
  assigneeId: string | null;
  actorId: string;
  comment: string | null;
  isRejected?: boolean;
  attachments?: Record<string, unknown>;
  createdAt: string;
  actor?: TeamMember;
  assignee?: TeamMember;
  issue?: Issue;
}
