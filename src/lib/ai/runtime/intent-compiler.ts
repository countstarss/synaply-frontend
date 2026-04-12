import { z } from "zod";
import type { AiRuntimeContext } from "@/lib/ai/runtime/context";
import type {
  AiActorContextDetail,
  AiExecutionActionDefinition,
  AiExecutionActionEnumHint,
  AiExecutionActionField,
  AiExecutionManifest,
  AiIssueSearchResult,
  AiProjectSearchResult,
  AiThreadRecord,
  AiWorkspaceMemberSearchResult,
} from "@/lib/ai/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TEXT_FIELD_NAMES = new Set([
  "title",
  "name",
  "brief",
  "description",
  "comment",
  "reason",
  "resultText",
  "prompt",
  "phase",
  "content",
  "targetName",
]);
const CURRENT_PROJECT_PATTERNS = [
  "当前项目",
  "这个项目",
  "该项目",
  "本项目",
  "current project",
  "this project",
];
const CURRENT_ISSUE_PATTERNS = [
  "当前任务",
  "这个任务",
  "该任务",
  "本任务",
  "当前 issue",
  "this issue",
  "current issue",
  "当前流程",
  "这个流程",
];
const CURRENT_USER_PATTERNS = ["我", "自己", "当前用户", "me", "myself"];
const AMBIGUOUS_VISIBILITY_PATTERNS = [
  "团队可见",
  "团队",
  "team",
  "团队可访问",
  "团队可查看",
];

const finalIntentSchema = z.object({
  type: z.literal("final"),
  reply: z.string().trim().min(1),
});

const clarifyIntentSchema = z.object({
  type: z.literal("clarify"),
  question: z.string().trim().min(1),
  missing: z.array(z.string().trim().min(1)).max(8).optional(),
  reason: z.string().trim().min(1).optional(),
});

const readIntentSchema = z.object({
  type: z.literal("read"),
  tool: z.string().trim().min(1),
  arguments: z.record(z.string(), z.unknown()).default({}),
});

const preparedExecutionSchema = z.object({
  actionKey: z.string().trim().min(1),
  inputDraft: z.record(z.string(), z.unknown()).default({}),
  missing: z.array(z.string().trim().min(1)).max(8).optional(),
  confidence: z.number().min(0).max(1).optional(),
  evidence: z.string().trim().min(1).optional(),
  summary: z.string().trim().min(1).optional(),
});

const prepareExecuteIntentSchema = preparedExecutionSchema.extend({
  type: z.literal("prepare_execute"),
});

const prepareExecuteManyIntentSchema = z.object({
  type: z.literal("prepare_execute_many"),
  summary: z.string().trim().min(1).optional(),
  items: z.array(preparedExecutionSchema).min(1).max(20),
});

export const intentPlanSchema = z.discriminatedUnion("type", [
  finalIntentSchema,
  clarifyIntentSchema,
  readIntentSchema,
  prepareExecuteIntentSchema,
  prepareExecuteManyIntentSchema,
]);

export type IntentPlan = z.infer<typeof intentPlanSchema>;
export type PreparedExecution = z.infer<typeof preparedExecutionSchema>;

export type CompiledIntentResult =
  | { type: "clarify"; reply: string }
  | { type: "execute"; actionKey: string; input: Record<string, unknown> }
  | {
      type: "execute_many";
      summary: string;
      items: Array<{
        actionKey: string;
        input: Record<string, unknown>;
        summary?: string;
      }>;
    };

export interface IntentCompilerLookups {
  getCurrentActor: () => Promise<AiActorContextDetail>;
  searchProjects: (params: {
    query: string;
    limit?: number;
  }) => Promise<AiProjectSearchResult>;
  searchIssues: (params: {
    query: string;
    projectId?: string;
    limit?: number;
  }) => Promise<AiIssueSearchResult>;
  searchWorkspaceMembers: (params: {
    query: string;
    limit?: number;
  }) => Promise<AiWorkspaceMemberSearchResult>;
}

export interface IntentCompilerContext extends IntentCompilerLookups {
  manifest: AiExecutionManifest;
  allowlist: ReadonlySet<string>;
  runtimeContext: AiRuntimeContext;
  thread?: Pick<AiThreadRecord, "originSurfaceType" | "originSurfaceId" | "pins"> | null;
}

function extractJsonObject(rawText: string) {
  const fencedMatch = rawText.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return rawText.slice(firstBrace, lastBrace + 1).trim();
  }

  return rawText.trim();
}

export function parseIntentPlan(rawText: string): IntentPlan {
  const parsed = JSON.parse(extractJsonObject(rawText)) as unknown;
  return intentPlanSchema.parse(parsed);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isUuidLike(value: string) {
  return UUID_RE.test(value.trim());
}

function isCurrentPattern(value: string, patterns: string[]) {
  const normalized = normalizeText(value);
  return patterns.some((pattern) => normalizeText(pattern) === normalized);
}

function isCurrentUserRef(value: string) {
  return isCurrentPattern(value, CURRENT_USER_PATTERNS);
}

function extractDraftString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const candidates = [
    record.id,
    record.query,
    record.name,
    record.title,
    record.key,
    record.email,
    record.value,
    record.label,
    record.userId,
    record.teamMemberId,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function splitDraftStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => extractDraftString(item))
      .filter((item): item is string => Boolean(item));
  }

  const single = extractDraftString(value);
  if (!single) {
    return [];
  }

  return single
    .split(/[\n,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSurfaceIds(
  thread: Pick<AiThreadRecord, "originSurfaceType" | "originSurfaceId" | "pins"> | null | undefined,
  runtimeContext: AiRuntimeContext,
  surfaceType: "PROJECT" | "ISSUE" | "WORKFLOW",
) {
  const ids = new Set<string>();

  if (runtimeContext.surface?.type === surfaceType && runtimeContext.surface.id) {
    ids.add(runtimeContext.surface.id);
  }

  if (thread?.originSurfaceType === surfaceType && thread.originSurfaceId) {
    ids.add(thread.originSurfaceId);
  }

  for (const pin of thread?.pins ?? []) {
    if (pin.surfaceType === surfaceType && pin.surfaceId) {
      ids.add(pin.surfaceId);
    }
  }

  return Array.from(ids);
}

function getImplicitProjectId(context: IntentCompilerContext) {
  const ids = getSurfaceIds(context.thread, context.runtimeContext, "PROJECT");
  return ids.length === 1 ? ids[0] : null;
}

function getImplicitIssueId(context: IntentCompilerContext) {
  const issueIds = [
    ...getSurfaceIds(context.thread, context.runtimeContext, "ISSUE"),
    ...getSurfaceIds(context.thread, context.runtimeContext, "WORKFLOW"),
  ];
  const ids = Array.from(new Set(issueIds));
  return ids.length === 1 ? ids[0] : null;
}

function getActionDefinition(
  manifest: AiExecutionManifest,
  actionKey: string,
): AiExecutionActionDefinition | null {
  return manifest.actions.find((action) => action.key === actionKey) ?? null;
}

function isIdField(field: AiExecutionActionField) {
  return field.name.endsWith("Id") || field.name.endsWith("Ids");
}

function isFreeTextField(field: AiExecutionActionField) {
  return field.type === "string" && TEXT_FIELD_NAMES.has(field.name);
}

function buildGenericClarifyMessage(
  action: AiExecutionActionDefinition,
  field: AiExecutionActionField,
  reason?: string,
) {
  return reason
    ? `要执行“${action.label}”，我还需要先把“${field.label}”确定清楚：${reason}`
    : `要执行“${action.label}”，我还需要先把“${field.label}”确定清楚。`;
}

function matchEnumByHint(
  rawValue: string,
  hints: AiExecutionActionEnumHint[] | undefined,
) {
  if (!Array.isArray(hints) || hints.length === 0) {
    return null;
  }

  const normalized = normalizeText(rawValue).replace(/[\s-]+/g, "_");
  for (const hint of hints) {
    if (normalizeText(hint.value).replace(/[\s-]+/g, "_") === normalized) {
      return hint.value;
    }

    if (
      hint.aliases.some(
        (alias) =>
          normalizeText(alias).replace(/[\s-]+/g, "_") === normalized,
      )
    ) {
      return hint.value;
    }
  }

  return null;
}

function compileEnumValue(field: AiExecutionActionField, rawValue: unknown) {
  const draft = extractDraftString(rawValue);
  if (!draft) {
    return { status: "omit" as const };
  }

  if (
    field.name === "visibility" &&
    AMBIGUOUS_VISIBILITY_PATTERNS.some(
      (pattern) => normalizeText(pattern) === normalizeText(draft),
    )
  ) {
    return {
      status: "clarify" as const,
      reason: "请明确是“团队只读”还是“团队可编辑”。",
    };
  }

  const exactMatch = field.options?.find((option) => option === draft);
  if (exactMatch) {
    return { status: "compiled" as const, value: exactMatch };
  }

  const hintedMatch = matchEnumByHint(draft, field.enumHints);
  if (hintedMatch) {
    return { status: "compiled" as const, value: hintedMatch };
  }

  if (!field.required && field.omitWhenUncertain) {
    return { status: "clarify" as const, reason: `当前无法把“${draft}”稳定映射到 ${field.label}。` };
  }

  return {
    status: "clarify" as const,
    reason: `可选值是：${field.options?.join(" / ") ?? "未定义"}`,
  };
}

async function resolveMemberReference(
  draft: string,
  context: IntentCompilerContext,
) {
  if (isCurrentUserRef(draft)) {
    const actor = await context.getCurrentActor();
    return {
      status: "compiled" as const,
      userId: actor.actor.userId,
      teamMemberId: actor.actor.teamMemberId,
      label:
        actor.actor.name ?? actor.actor.email ?? actor.actor.userId ?? "当前用户",
    };
  }

  const result = await context.searchWorkspaceMembers({
    query: draft,
    limit: 8,
  });
  const items = result.items;

  if (items.length === 0) {
    return {
      status: "clarify" as const,
      reason: `我没有在当前 workspace 里找到“${draft}”这个成员。`,
    };
  }

  const exactMatches = items.filter((item) => {
    const candidates = [item.name, item.email, item.userId, item.teamMemberId]
      .filter((candidate): candidate is string => Boolean(candidate))
      .map(normalizeText);
    return candidates.includes(normalizeText(draft));
  });

  const matches = exactMatches.length === 1 ? exactMatches : items;
  if (matches.length === 1) {
    return {
      status: "compiled" as const,
      userId: matches[0].userId,
      teamMemberId: matches[0].teamMemberId,
      label:
        matches[0].name ??
        matches[0].email ??
        matches[0].userId ??
        matches[0].teamMemberId,
    };
  }

  return {
    status: "clarify" as const,
    reason: `我找到了多个匹配成员：${matches
      .slice(0, 4)
      .map((item) => item.name ?? item.email ?? item.userId)
      .join(" / ")}。`,
  };
}

async function resolveProjectReference(
  draft: string,
  context: IntentCompilerContext,
) {
  if (isUuidLike(draft)) {
    return { status: "compiled" as const, projectId: draft, label: draft };
  }

  if (isCurrentPattern(draft, CURRENT_PROJECT_PATTERNS)) {
    const projectId = getImplicitProjectId(context);
    if (projectId) {
      return { status: "compiled" as const, projectId, label: "当前项目" };
    }
  }

  const result = await context.searchProjects({ query: draft, limit: 8 });
  const items = result.items;

  if (items.length === 0) {
    return {
      status: "clarify" as const,
      reason: `我没有找到“${draft}”这个项目。`,
    };
  }

  const exactMatches = items.filter(
    (item) => normalizeText(item.name) === normalizeText(draft),
  );
  const matches = exactMatches.length === 1 ? exactMatches : items;

  if (matches.length === 1) {
    return {
      status: "compiled" as const,
      projectId: matches[0].id,
      label: matches[0].name,
    };
  }

  return {
    status: "clarify" as const,
    reason: `我找到了多个匹配项目：${matches
      .slice(0, 4)
      .map((item) => item.name)
      .join(" / ")}。`,
  };
}

async function resolveIssueReference(
  draft: string,
  context: IntentCompilerContext,
  projectId?: string,
) {
  if (isUuidLike(draft)) {
    return { status: "compiled" as const, issueId: draft, label: draft };
  }

  if (isCurrentPattern(draft, CURRENT_ISSUE_PATTERNS)) {
    const issueId = getImplicitIssueId(context);
    if (issueId) {
      return { status: "compiled" as const, issueId, label: "当前任务" };
    }
  }

  const result = await context.searchIssues({
    query: draft,
    projectId,
    limit: 8,
  });
  const items = result.items;

  if (items.length === 0) {
    return {
      status: "clarify" as const,
      reason: `我没有找到“${draft}”这条任务或流程。`,
    };
  }

  const exactMatches = items.filter((item) => {
    const candidates = [item.key, item.title]
      .filter((candidate): candidate is string => Boolean(candidate))
      .map(normalizeText);
    return candidates.includes(normalizeText(draft));
  });
  const matches = exactMatches.length === 1 ? exactMatches : items;

  if (matches.length === 1) {
    return {
      status: "compiled" as const,
      issueId: matches[0].id,
      label: matches[0].key
        ? `${matches[0].key} ${matches[0].title}`
        : matches[0].title,
    };
  }

  return {
    status: "clarify" as const,
    reason: `我找到了多条匹配任务：${matches
      .slice(0, 4)
      .map((item) => (item.key ? `${item.key} ${item.title}` : item.title))
      .join(" / ")}。`,
  };
}

async function compileIdValue(params: {
  field: AiExecutionActionField;
  rawValue: unknown;
  action: AiExecutionActionDefinition;
  context: IntentCompilerContext;
  currentCompiledInput: Record<string, unknown>;
}) {
  const { field, rawValue, action, context, currentCompiledInput } = params;
  const singleDraft = extractDraftString(rawValue);
  const listDrafts = splitDraftStringList(rawValue);

  if (field.name === "projectId" || field.entityRef === "project") {
    const fallbackProjectId = getImplicitProjectId(context);
    const draft = singleDraft ?? fallbackProjectId;
    if (!draft) {
      return field.required
        ? {
            status: "clarify" as const,
            reason: buildGenericClarifyMessage(action, field),
          }
        : { status: "omit" as const };
    }

    const result = await resolveProjectReference(draft, context);
    if (result.status !== "compiled") {
      return {
        status: "clarify" as const,
        reason: buildGenericClarifyMessage(action, field, result.reason),
      };
    }

    return { status: "compiled" as const, value: result.projectId };
  }

  if (field.name === "issueId" || field.entityRef === "issue") {
    const scopedProjectId =
      typeof currentCompiledInput.projectId === "string"
        ? currentCompiledInput.projectId
        : getImplicitProjectId(context) ?? undefined;
    const fallbackIssueId = getImplicitIssueId(context);
    const draft = singleDraft ?? fallbackIssueId;
    if (!draft) {
      return field.required
        ? {
            status: "clarify" as const,
            reason: buildGenericClarifyMessage(action, field),
          }
        : { status: "omit" as const };
    }

    const result = await resolveIssueReference(draft, context, scopedProjectId);
    if (result.status !== "compiled") {
      return {
        status: "clarify" as const,
        reason: buildGenericClarifyMessage(action, field, result.reason),
      };
    }

    return { status: "compiled" as const, value: result.issueId };
  }

  if (
    field.name === "ownerMemberId" ||
    field.name === "assigneeIds" ||
    field.entityRef === "member"
  ) {
    const drafts = listDrafts.length > 0 ? listDrafts : singleDraft ? [singleDraft] : [];
    if (drafts.length === 0) {
      return field.required
        ? {
            status: "clarify" as const,
            reason: buildGenericClarifyMessage(action, field),
          }
        : { status: "omit" as const };
    }

    const resolvedIds: string[] = [];
    for (const draft of drafts) {
      if (isUuidLike(draft)) {
        resolvedIds.push(draft);
        continue;
      }

      const result = await resolveMemberReference(draft, context);
      if (result.status !== "compiled") {
        return {
          status: "clarify" as const,
          reason: buildGenericClarifyMessage(action, field, result.reason),
        };
      }
      resolvedIds.push(result.teamMemberId);
    }

    return {
      status: "compiled" as const,
      value: field.name.endsWith("Ids") ? resolvedIds : resolvedIds[0],
    };
  }

  if (field.name === "targetUserId" || field.entityRef === "user") {
    if (!singleDraft) {
      return {
        status: "clarify" as const,
        reason: buildGenericClarifyMessage(action, field),
      };
    }

    if (isUuidLike(singleDraft)) {
      return { status: "compiled" as const, value: singleDraft };
    }

    const result = await resolveMemberReference(singleDraft, context);
    if (result.status !== "compiled") {
      return {
        status: "clarify" as const,
        reason: buildGenericClarifyMessage(action, field, result.reason),
      };
    }

    return { status: "compiled" as const, value: result.userId };
  }

  if (field.name === "parentId" || field.name === "stateId" || field.name === "labelIds") {
    if (!singleDraft && listDrafts.length === 0) {
      return field.required
        ? {
            status: "clarify" as const,
            reason: buildGenericClarifyMessage(action, field),
          }
        : { status: "omit" as const };
    }

    if (field.name.endsWith("Ids")) {
      const values = listDrafts;
      if (values.every(isUuidLike)) {
        return { status: "compiled" as const, value: values };
      }
    } else if (singleDraft && isUuidLike(singleDraft)) {
      return { status: "compiled" as const, value: singleDraft };
    }

    return {
      status: "clarify" as const,
      reason: `当前还不能自动把“${singleDraft ?? listDrafts.join(", ")}”映射为 ${field.label} 的真实 ID。`,
    };
  }

  if (singleDraft && isUuidLike(singleDraft)) {
    return { status: "compiled" as const, value: singleDraft };
  }

  return {
    status: "clarify" as const,
    reason: `当前还不能安全解析 ${field.label}。`,
  };
}

async function compileFieldValue(params: {
  field: AiExecutionActionField;
  rawValue: unknown;
  action: AiExecutionActionDefinition;
  context: IntentCompilerContext;
  currentCompiledInput: Record<string, unknown>;
}) {
  const { field, rawValue, action, context, currentCompiledInput } = params;

  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return field.required
      ? {
          status: "clarify" as const,
          reason: buildGenericClarifyMessage(action, field),
        }
      : { status: "omit" as const };
  }

  if (field.type === "enum") {
    return compileEnumValue(field, rawValue);
  }

  if (field.entityRef || isIdField(field)) {
    return compileIdValue({
      field,
      rawValue,
      action,
      context,
      currentCompiledInput,
    });
  }

  if (field.type === "json") {
    if (typeof rawValue === "object" && rawValue !== null) {
      return { status: "compiled" as const, value: rawValue };
    }

    return field.required
      ? {
          status: "clarify" as const,
          reason: buildGenericClarifyMessage(action, field, "需要结构化对象。"),
        }
      : { status: "omit" as const };
  }

  if (field.type === "string[]") {
    const values = splitDraftStringList(rawValue);
    if (values.length === 0) {
      return field.required
        ? {
            status: "clarify" as const,
            reason: buildGenericClarifyMessage(action, field),
          }
        : { status: "omit" as const };
    }

    return { status: "compiled" as const, value: values };
  }

  const draft = extractDraftString(rawValue);
  if (!draft) {
    return field.required
      ? {
          status: "clarify" as const,
          reason: buildGenericClarifyMessage(action, field),
        }
      : { status: "omit" as const };
  }

  if (field.type === "date") {
    const asDate = new Date(draft);
    if (Number.isNaN(asDate.getTime())) {
      return {
        status: "clarify" as const,
        reason: buildGenericClarifyMessage(action, field, "请提供明确日期。"),
      };
    }

    return { status: "compiled" as const, value: asDate.toISOString() };
  }

  if (field.type === "string" && isFreeTextField(field)) {
    return { status: "compiled" as const, value: draft };
  }

  if (field.type === "string") {
    return { status: "compiled" as const, value: draft };
  }

  return { status: "omit" as const };
}

async function compilePreparedAction(
  prepared: PreparedExecution,
  context: IntentCompilerContext,
) {
  const action = getActionDefinition(context.manifest, prepared.actionKey);

  if (!action || !context.allowlist.has(prepared.actionKey)) {
    return {
      type: "clarify" as const,
      reply: `当前 runtime 暂未开放动作 ${prepared.actionKey}。`,
    };
  }

  if (prepared.missing && prepared.missing.length > 0) {
    return {
      type: "clarify" as const,
      reply: `要执行“${action.label}”，还缺少这些关键信息：${prepared.missing.join("、")}。`,
    };
  }

  const compiledInput: Record<string, unknown> = {};

  for (const field of action.fields) {
    if (
      action.key === "attach_coding_prompt_to_issue" &&
      field.name === "prompt" &&
      prepared.inputDraft.prompt === undefined
    ) {
      continue;
    }

    let rawValue = prepared.inputDraft[field.name];

    if (rawValue === undefined || rawValue === null || rawValue === "") {
      if (field.name === "projectId") {
        rawValue = getImplicitProjectId(context);
      }

      if (field.name === "issueId") {
        rawValue = getImplicitIssueId(context);
      }
    }

    const fieldResult = await compileFieldValue({
      field,
      rawValue,
      action,
      context,
      currentCompiledInput: compiledInput,
    });

    if (fieldResult.status === "clarify") {
      return {
        type: "clarify" as const,
        reply: fieldResult.reason,
      };
    }

    if (fieldResult.status === "compiled") {
      compiledInput[field.name] = fieldResult.value;
    }
  }

  return {
    type: "execute" as const,
    actionKey: action.key,
    input: compiledInput,
  };
}

export async function compileIntentPlan(
  plan: IntentPlan,
  context: IntentCompilerContext,
): Promise<CompiledIntentResult | null> {
  if (plan.type === "prepare_execute") {
    return compilePreparedAction(plan, context);
  }

  if (plan.type === "prepare_execute_many") {
    const compiledItems: Array<{
      actionKey: string;
      input: Record<string, unknown>;
      summary?: string;
    }> = [];

    for (const item of plan.items) {
      const compiled = await compilePreparedAction(item, context);
      if (!compiled) {
        continue;
      }

      if (compiled.type !== "execute") {
        return compiled;
      }

      compiledItems.push({
        actionKey: compiled.actionKey,
        input: compiled.input,
        summary: item.summary,
      });
    }

    return {
      type: "execute_many",
      summary:
        plan.summary?.trim() || `批量执行 ${Math.max(compiledItems.length, 1)} 个动作`,
      items: compiledItems,
    };
  }

  return null;
}
