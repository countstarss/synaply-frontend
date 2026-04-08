export const REALTIME_EVENTS = {
  COMMENT_CREATED: "comment.created",
  ISSUE_CREATED: "issue.created",
  ISSUE_UPDATED: "issue.updated",
  ISSUE_DELETED: "issue.deleted",
  ISSUE_ACTIVITY_CREATED: "issue.activity.created",
  ISSUE_STEP_RECORD_CREATED: "issue.step_record.created",
  WORKFLOW_NODE_STATUS_CHANGED: "workflow.node.status_changed",
  WORKFLOW_NODE_MOVED_NEXT: "workflow.node.moved_next",
  WORKFLOW_NODE_MOVED_PREVIOUS: "workflow.node.moved_previous",
} as const;

export type RealtimeEventName =
  (typeof REALTIME_EVENTS)[keyof typeof REALTIME_EVENTS];

export const ISSUE_REALTIME_EVENTS = [
  REALTIME_EVENTS.COMMENT_CREATED,
  REALTIME_EVENTS.ISSUE_UPDATED,
  REALTIME_EVENTS.ISSUE_DELETED,
  REALTIME_EVENTS.ISSUE_ACTIVITY_CREATED,
] as const satisfies readonly RealtimeEventName[];

export const WORKFLOW_REALTIME_EVENTS = [
  REALTIME_EVENTS.ISSUE_STEP_RECORD_CREATED,
  REALTIME_EVENTS.WORKFLOW_NODE_STATUS_CHANGED,
  REALTIME_EVENTS.WORKFLOW_NODE_MOVED_NEXT,
  REALTIME_EVENTS.WORKFLOW_NODE_MOVED_PREVIOUS,
] as const satisfies readonly RealtimeEventName[];

export const WORKSPACE_REALTIME_EVENTS = [
  REALTIME_EVENTS.ISSUE_CREATED,
  REALTIME_EVENTS.ISSUE_UPDATED,
  REALTIME_EVENTS.ISSUE_DELETED,
] as const satisfies readonly RealtimeEventName[];

export type IssueRealtimeEditingField =
  | "title"
  | "description"
  | "state"
  | "assignee"
  | "dueDate"
  | "priority";

export interface IssueRealtimePresence {
  clientSessionId: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  editingField: IssueRealtimeEditingField | null;
  focusingNode: string | null;
}

export interface CommentCreatedPayload {
  issueId: string;
  workspaceId: string;
  commentId: string;
  parentId: string | null;
  authorId: string;
}

export interface IssueUpdatedPayload {
  issueId: string;
  workspaceId: string;
  changedFields: string[];
  issueType: string | null;
}

export interface IssueCreatedPayload {
  issueId: string;
  workspaceId: string;
  issueType: string | null;
}

export interface IssueDeletedPayload {
  issueId: string;
  workspaceId: string;
}

export interface IssueActivityCreatedPayload {
  issueId: string;
  workspaceId: string;
  activityId: string;
  actorId: string;
  action: string;
}

export interface IssueStepRecordCreatedPayload {
  issueId: string;
  workspaceId: string;
  stepRecordId: string;
  stepId: string;
  assigneeId: string;
}

export interface WorkflowNodeTransitionPayload {
  issueId: string;
  workspaceId: string;
  fromStepId: string | null;
  toStepId: string | null;
  fromIndex: number | null;
  toIndex: number | null;
  currentStepStatus: string | null;
}

export interface RealtimePayloadMap {
  [REALTIME_EVENTS.COMMENT_CREATED]: CommentCreatedPayload;
  [REALTIME_EVENTS.ISSUE_CREATED]: IssueCreatedPayload;
  [REALTIME_EVENTS.ISSUE_UPDATED]: IssueUpdatedPayload;
  [REALTIME_EVENTS.ISSUE_DELETED]: IssueDeletedPayload;
  [REALTIME_EVENTS.ISSUE_ACTIVITY_CREATED]: IssueActivityCreatedPayload;
  [REALTIME_EVENTS.ISSUE_STEP_RECORD_CREATED]: IssueStepRecordCreatedPayload;
  [REALTIME_EVENTS.WORKFLOW_NODE_STATUS_CHANGED]: WorkflowNodeTransitionPayload;
  [REALTIME_EVENTS.WORKFLOW_NODE_MOVED_NEXT]: WorkflowNodeTransitionPayload;
  [REALTIME_EVENTS.WORKFLOW_NODE_MOVED_PREVIOUS]: WorkflowNodeTransitionPayload;
}

export function isWorkflowRealtimeEvent(
  event: RealtimeEventName,
): event is
  | typeof REALTIME_EVENTS.ISSUE_STEP_RECORD_CREATED
  | typeof REALTIME_EVENTS.WORKFLOW_NODE_STATUS_CHANGED
  | typeof REALTIME_EVENTS.WORKFLOW_NODE_MOVED_NEXT
  | typeof REALTIME_EVENTS.WORKFLOW_NODE_MOVED_PREVIOUS {
  return (WORKFLOW_REALTIME_EVENTS as readonly RealtimeEventName[]).includes(
    event,
  );
}
