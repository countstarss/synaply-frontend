"use client";

import { getSupabasePublicConfig } from "@/lib/supabase";
import {
  REALTIME_EVENTS,
  type CommentCreatedPayload,
  type IssueCreatedPayload,
  type IssueDeletedPayload,
  type IssueActivityCreatedPayload,
  type IssueStepRecordCreatedPayload,
  type IssueUpdatedPayload,
  type RealtimeEventName,
} from "./events";
import {
  buildIssueTopic,
  buildWorkflowIssueTopic,
  buildWorkspaceTopic,
} from "./topics";

type RealtimePayload =
  | CommentCreatedPayload
  | IssueCreatedPayload
  | IssueDeletedPayload
  | IssueUpdatedPayload
  | IssueActivityCreatedPayload
  | IssueStepRecordCreatedPayload;

function logBroadcastDebug(message: string, payload?: unknown) {
  return;
}

function buildBroadcastEndpoint() {
  const { url } = getSupabasePublicConfig();
  return `${url.replace(/\/+$/, "")}/realtime/v1/api/broadcast`;
}

async function sendBroadcast(
  topic: string,
  event: RealtimeEventName,
  payload: RealtimePayload,
  accessToken: string,
) {
  const { anonKey } = getSupabasePublicConfig();

  try {
    logBroadcastDebug("send via rest", { topic, event, payload });

    const response = await fetch(buildBroadcastEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        messages: [
          {
            topic,
            event,
            payload,
            private: true,
          },
        ],
      }),
    });

    if (response.ok) {
      logBroadcastDebug("sent via rest", { topic, event });
      return;
    }

    let errorMessage = response.statusText || "Broadcast failed";

    try {
      const errorBody = await response.json();
      errorMessage =
        errorBody?.error ||
        errorBody?.message ||
        (typeof errorBody === "string" ? errorBody : errorMessage);
    } catch {
      const errorText = await response.text().catch(() => "");
      errorMessage = errorText || errorMessage;
    }

  } catch (error) {
    return;
  }
}

export async function broadcastCommentCreated(
  payload: CommentCreatedPayload,
  accessToken: string,
) {
  await sendBroadcast(
    buildIssueTopic(payload.issueId),
    REALTIME_EVENTS.COMMENT_CREATED,
    payload,
    accessToken,
  );
}

export async function broadcastIssueCreated(
  payload: IssueCreatedPayload,
  accessToken: string,
) {
  await sendBroadcast(
    buildWorkspaceTopic(payload.workspaceId),
    REALTIME_EVENTS.ISSUE_CREATED,
    payload,
    accessToken,
  );
}

export async function broadcastIssueUpdated(
  payload: IssueUpdatedPayload,
  accessToken: string,
) {
  await Promise.all([
    sendBroadcast(
      buildIssueTopic(payload.issueId),
      REALTIME_EVENTS.ISSUE_UPDATED,
      payload,
      accessToken,
    ),
    sendBroadcast(
      buildWorkspaceTopic(payload.workspaceId),
      REALTIME_EVENTS.ISSUE_UPDATED,
      payload,
      accessToken,
    ),
  ]);
}

export async function broadcastIssueDeleted(
  payload: IssueDeletedPayload,
  accessToken: string,
) {
  await Promise.all([
    sendBroadcast(
      buildIssueTopic(payload.issueId),
      REALTIME_EVENTS.ISSUE_DELETED,
      payload,
      accessToken,
    ),
    sendBroadcast(
      buildWorkspaceTopic(payload.workspaceId),
      REALTIME_EVENTS.ISSUE_DELETED,
      payload,
      accessToken,
    ),
  ]);
}

export async function broadcastIssueActivityCreated(
  payload: IssueActivityCreatedPayload,
  accessToken: string,
){
  await sendBroadcast(
    buildIssueTopic(payload.issueId),
    REALTIME_EVENTS.ISSUE_ACTIVITY_CREATED,
    payload,
    accessToken,
  );
}

export async function broadcastIssueStepRecordCreated(
  payload: IssueStepRecordCreatedPayload,
  accessToken: string,
) {
  await sendBroadcast(
    buildWorkflowIssueTopic(payload.issueId),
    REALTIME_EVENTS.ISSUE_STEP_RECORD_CREATED,
    payload,
    accessToken,
  );
}
