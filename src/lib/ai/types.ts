export const AI_SURFACE_TYPES = [
  "WORKSPACE",
  "PROJECT",
  "ISSUE",
  "WORKFLOW",
  "DOC",
] as const;

export type AiSurfaceType = (typeof AI_SURFACE_TYPES)[number];

export const AI_MESSAGE_ROLES = [
  "USER",
  "ASSISTANT",
  "SYSTEM",
  "TOOL",
] as const;

export type AiMessageRole = (typeof AI_MESSAGE_ROLES)[number];

export const AI_PIN_SOURCES = ["ORIGIN", "USER", "AGENT"] as const;

export type AiPinSource = (typeof AI_PIN_SOURCES)[number];

export interface AiTextPart {
  type: "text";
  text: string;
}

export interface AiToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
}

export interface AiToolResultPart {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  output: unknown;
  isError?: boolean;
}

export interface AiApprovalRequestPart {
  type: "approval-request";
  approvalId: string;
  actionKey: string;
  summary: string;
  input: Record<string, unknown>;
  preview?: unknown;
}

export interface AiCodingPromptPart {
  type: "coding-prompt";
  issueId?: string;
  prompt: string;
  generatedAt: string;
}

export interface AiContextChipPart {
  type: "context-chip";
  surfaceType: AiSurfaceType;
  surfaceId: string;
  label: string;
}

export interface AiErrorPart {
  type: "error";
  message: string;
  detail?: unknown;
}

export type AiMessagePart =
  | AiTextPart
  | AiToolCallPart
  | AiToolResultPart
  | AiApprovalRequestPart
  | AiCodingPromptPart
  | AiContextChipPart
  | AiErrorPart;

export interface AiThreadPin {
  id: string;
  threadId: string;
  surfaceType: AiSurfaceType;
  surfaceId: string;
  source: AiPinSource;
  pinnedByUserId: string | null;
  pinnedAt: string;
}

export interface AiThreadRecord {
  id: string;
  workspaceId: string;
  creatorUserId: string;
  title: string | null;
  status: string;
  originSurfaceType: AiSurfaceType | null;
  originSurfaceId: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  pins: AiThreadPin[];
}

export interface AiMessageRecord {
  id: string;
  threadId: string;
  runId: string | null;
  role: AiMessageRole;
  parts: AiMessagePart[];
  createdAt: string;
}

export interface AiMessagePage {
  items: AiMessageRecord[];
  nextCursor: string | null;
}

export interface AiRunRecord {
  id: string;
  threadId: string;
  status: string;
  model: string;
  stepCount: number;
  maxSteps: number;
  tokenBudget: number;
  tokensUsed: number;
  startedAt: string;
  finishedAt: string | null;
  lastError: unknown;
  pendingApprovalId: string | null;
}

export interface AiApprovalRecord {
  id: string;
  threadId: string;
  runId: string;
  actionKey: string;
  summary: string | null;
  input: unknown;
  previewResult: unknown;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedByUserId: string | null;
  expiresAt: string;
}

export interface AiSurfaceSummary {
  surfaceType: AiSurfaceType;
  surfaceId: string;
  title: string;
  status?: string;
  ownerLabel?: string;
  recentActivity?: string;
  text: string;
}

export function getAiMessageText(parts: AiMessagePart[]) {
  return parts
    .flatMap((part) => {
      if (part.type === "text") {
        return [part.text];
      }

      if (part.type === "coding-prompt") {
        return [part.prompt];
      }

      if (part.type === "error") {
        return [part.message];
      }

      return [];
    })
    .join("\n")
    .trim();
}

export function hasUnsupportedAiParts(parts: AiMessagePart[]) {
  return parts.some(
    (part) =>
      part.type !== "text" &&
      part.type !== "error" &&
      part.type !== "coding-prompt",
  );
}
