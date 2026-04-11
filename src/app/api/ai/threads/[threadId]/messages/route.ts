import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAiText, type AiRuntimeMessage } from "@/lib/ai/agent";
import { DEFAULT_AI_MODEL_ID } from "@/lib/ai/models";
import {
  appendAiMessage,
  assembleAiCodingPrompt,
  createAiApproval,
  executeAiAction,
  finishAiRun,
  getAiApproval,
  getAiActorContext,
  getAiExecutionCapabilities,
  getAiExecutionManifest,
  getAiThread,
  listAiIssues,
  getAiWorkspaceSummary,
  getAiProjectDetail,
  getAiIssueDetail,
  getAiWorkflowRunDetail,
  getAiDocDetail,
  listAiThreadMessages,
  postAiSurfaceSummaries,
  recordAiRunStep,
  searchAiDocs,
  searchAiProjects,
  startAiRun,
  type ServerFetchOptions,
} from "@/lib/ai/backend";
import {
  createRuntimeContext,
  extractBearerToken,
} from "@/lib/ai/runtime/context";
import {
  confirmAndExecuteApproval,
  rejectApprovalWithMessage,
  type ApprovalBundleItem,
} from "@/lib/ai/runtime/approval-helpers";
import { buildAiSystemPrompt } from "@/lib/ai/runtime/system-prompt";
import {
  type AiCodingPromptAssembly,
  type AiApprovalRecord,
  type AiExecutionCapabilities,
  type AiExecutionManifest,
  type AiExecutionActionResult,
  type AiMessagePart,
  type AiMessageRecord,
} from "@/lib/ai/types";

const MAX_AGENT_STEPS = 6;
const EXECUTION_ACTION_ALLOWLIST = new Set([
  "create_project",
  "create_issue",
  "create_comment",
  "advance_workflow_run",
  "request_workflow_review",
  "attach_coding_prompt_to_issue",
]);
const READ_TOOL_NAMES = [
  "get_workspace_summary",
  "get_current_actor_context",
  "search_projects",
  "get_project_detail",
  "list_issues",
  "get_issue_detail",
  "get_workflow_run_detail",
  "search_docs",
  "get_doc_detail",
  "assemble_coding_prompt",
] as const;

const sendMessageSchema = z.object({
  workspaceId: z.string().trim().min(1),
  text: z.string().trim().min(1).max(4000),
});

const readDecisionSchema = z.object({
  type: z.literal("read"),
  tool: z.enum(READ_TOOL_NAMES),
  arguments: z.record(z.string(), z.unknown()).default({}),
});

const executeDecisionSchema = z.object({
  type: z.literal("execute"),
  actionKey: z.string().trim().min(1),
  input: z.record(z.string(), z.unknown()).default({}),
});

const executeManyItemSchema = z.object({
  actionKey: z.string().trim().min(1),
  input: z.record(z.string(), z.unknown()).default({}),
  summary: z.string().trim().min(1).optional(),
});

const executeManyDecisionSchema = z.object({
  type: z.literal("execute_many"),
  summary: z.string().trim().min(1).optional(),
  items: z.array(executeManyItemSchema).min(1).max(20),
});

const finalDecisionSchema = z.object({
  type: z.literal("final"),
  reply: z.string().trim().min(1),
});

const agentDecisionSchema = z.discriminatedUnion("type", [
  readDecisionSchema,
  executeDecisionSchema,
  executeManyDecisionSchema,
  finalDecisionSchema,
]);

type ReadToolName = (typeof READ_TOOL_NAMES)[number];
type AgentDecision = z.infer<typeof agentDecisionSchema>;

interface ToolEvent {
  toolCallId: string;
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
  isError?: boolean;
  text: string;
}

function describeMessagePartForRuntime(part: AiMessagePart) {
  switch (part.type) {
    case "text":
      return part.text.trim();
    case "error":
      return `[系统错误] ${part.message}`.trim();
    case "coding-prompt":
      return `[编码交接 Prompt] issue=${part.issueId ?? "unknown"}`;
    case "approval-request":
      return `[待确认动作] ${part.summary} (approvalId=${part.approvalId}, action=${part.actionKey})`;
    case "tool-result":
      if (part.output && typeof part.output === "object") {
        const output = part.output as {
          status?: unknown;
          summary?: unknown;
          message?: unknown;
        };

        return clipText(
          [
            `[工具结果 ${part.toolName}]`,
            typeof output.status === "string" ? `status=${output.status}` : null,
            typeof output.summary === "string"
              ? `summary=${output.summary}`
              : null,
            typeof output.message === "string"
              ? `message=${output.message}`
              : null,
          ]
            .filter(Boolean)
            .join(" "),
          600,
        );
      }

      return `[工具结果 ${part.toolName}]`;
    default:
      return "";
  }
}

function toRuntimeMessages(messages: AiMessageRecord[]): AiRuntimeMessage[] {
  return messages.reduce<AiRuntimeMessage[]>((accumulator, message) => {
    const text = message.parts
      .map((part) => describeMessagePartForRuntime(part))
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!text) {
      return accumulator;
    }

    if (message.role === "USER") {
      accumulator.push({ role: "user", content: text });
      return accumulator;
    }

    if (message.role === "ASSISTANT") {
      accumulator.push({ role: "assistant", content: text });
      return accumulator;
    }

    if (message.role === "SYSTEM" || message.role === "TOOL") {
      accumulator.push({ role: "system", content: text });
      return accumulator;
    }

    return accumulator;
  }, []);
}

function buildSummaryMessage(summaries: Array<{ text: string }>) {
  return summaries
    .map((summary) => summary.text.trim())
    .filter(Boolean)
    .join("\n\n");
}

function clipText(value: string, maxLength = 2200) {
  const text = value.trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(maxLength - 1, 0)).trimEnd()}…`;
}

function safeJson(value: unknown, maxLength = 2600) {
  try {
    const raw = JSON.stringify(
      value,
      (_, currentValue) =>
        currentValue instanceof Date
          ? currentValue.toISOString()
          : typeof currentValue === "bigint"
            ? Number(currentValue)
            : currentValue,
      2,
    );

    return clipText(raw, maxLength);
  } catch {
    return clipText(String(value), maxLength);
  }
}

function toErrorPayload(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    message: "发生未知错误",
    detail: String(error),
  };
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

function parseAgentDecision(rawText: string): AgentDecision {
  const candidate = extractJsonObject(rawText);

  const parseAsDecision = (value: unknown): AgentDecision => {
    if (Array.isArray(value)) {
      const items = value.map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "type" in item &&
          (item as { type?: unknown }).type === "execute"
        ) {
          const parsedItem = executeDecisionSchema.parse(item);
          return {
            actionKey: parsedItem.actionKey,
            input: parsedItem.input,
          };
        }

        return executeManyItemSchema.parse(item);
      });
      return executeManyDecisionSchema.parse({
        type: "execute_many",
        items,
      });
    }

    return agentDecisionSchema.parse(value);
  };

  const parseJsonLines = () => {
    const lines = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (
      lines.length <= 1 ||
      !lines.every((line) => line.startsWith("{") && line.endsWith("}"))
    ) {
      return null;
    }

    return lines.map((line) => JSON.parse(line) as unknown);
  };

  try {
    const parsed = JSON.parse(candidate) as unknown;
    return parseAsDecision(parsed);
  } catch (error) {
    try {
      const parsedJsonLines = parseJsonLines();

      if (parsedJsonLines) {
        return parseAsDecision(parsedJsonLines);
      }
    } catch (jsonLinesError) {
      console.warn("[ai-runtime] json-lines parse fallback failed", {
        error:
          jsonLinesError instanceof Error
            ? jsonLinesError.message
            : String(jsonLinesError),
      });
    }

    const fallbackReply = rawText.trim();

    console.warn("[ai-runtime] decision parse fallback", {
      error: error instanceof Error ? error.message : String(error),
      rawText,
      candidate,
    });

    if (fallbackReply) {
      return {
        type: "final",
        reply: fallbackReply,
      };
    }

    throw error;
  }
}

function buildReadToolCatalog() {
  return [
    "- get_workspace_summary(args: {}): 读取当前 workspace 的整体协作摘要、项目/任务/文档计数和最近对象。",
    "- get_current_actor_context(args: {}): 读取当前登录用户在当前 workspace 里的 userId / teamMemberId / role。",
    '- search_projects(args: { query: string, limit?: number }): 按项目名、brief、描述搜索真实项目，返回 projectId；sample: {\"query\":\"口袋吉他\"}。',
    '- get_project_detail(args: { projectId: string }): 读取某个项目的深度信息、关键任务和风险概览。',
    '- list_issues(args: { projectId?: string, assigneeScope?: \"ANY\" | \"ME\", stateCategories?: string[], limit?: number }): 按项目、当前用户和状态类别列出 issue；assigneeScope 只能填 ANY 或 ME。',
    '- get_issue_detail(args: { issueId: string }): 读取 issue 的正文、状态、关联文档、最近评论和 handoff 状态。',
    '- get_workflow_run_detail(args: { issueId: string }): 读取 workflow run 当前步骤、最近 step records 和活动。',
    '- search_docs(args: { query: string, limit?: number }): 在当前 workspace 内搜索可读文档；sample: {\"query\":\"设计评审\"}。',
    '- get_doc_detail(args: { docId: string }): 读取文档正文摘录与最近 revisions。',
    '- assemble_coding_prompt(args: { issueId: string }): 组装可直接交给 Claude Code / Codex 的编码交接 prompt。',
  ].join("\n");
}

function buildActionCatalog(
  manifest: AiExecutionManifest,
  capabilities: AiExecutionCapabilities,
) {
  const capabilitiesByKey = new Map(
    capabilities.actions.map((action) => [action.key, action]),
  );

  const actions = manifest.actions
    .filter((action) => EXECUTION_ACTION_ALLOWLIST.has(action.key))
    .filter(
      (action) =>
        capabilitiesByKey.get(action.key)?.availability?.status !==
        "unavailable",
    );

  if (actions.length === 0) {
    return "- 当前没有可用写动作，只能读取上下文并给建议。";
  }

  return actions
    .map((action) => {
      const capability = capabilitiesByKey.get(action.key);
      const availability = capability?.availability;
      const fields = Array.isArray(capability?.fields)
        ? capability.fields
        : Array.isArray(action.fields)
          ? action.fields
          : [];
      const fieldText =
        fields.length > 0
          ? fields
              .map((field) =>
                `${field.name}${field.required ? " [required]" : ""}${
                  field.type === "enum" && Array.isArray(field.options)
                    ? ` {${field.options.join(" | ")}}`
                    : ""
                }`,
              )
              .join(", ")
          : "无";
      const sampleText =
        action.sampleInput && Object.keys(action.sampleInput).length > 0
          ? JSON.stringify(action.sampleInput)
          : "{}";

      return `- ${action.key} (${action.approvalMode}, ${action.targetType}, availability=${availability?.status ?? "unknown"}): ${action.description} | fields: ${fieldText} | sampleInput: ${sampleText}`;
    })
    .join("\n");
}

function buildDecisionSystemPrompt(params: {
  baseSystemPrompt: string;
  manifest: AiExecutionManifest;
  capabilities: AiExecutionCapabilities;
}) {
  return [
    params.baseSystemPrompt,
    "",
    "你现在运行在 Synaply 的 AI execution loop 中。",
    "你必须严格只返回一个 JSON object，不要输出 Markdown、解释、前后缀或代码围栏。",
    "",
    "只允许四种返回形态：",
    '{"type":"final","reply":"给用户的最终回复"}',
    '{"type":"read","tool":"get_issue_detail","arguments":{"issueId":"..."}}',
    '{"type":"execute","actionKey":"create_issue","input":{"title":"..."}}',
    '{"type":"execute_many","summary":"批量创建 Phase 1 issues","items":[{"actionKey":"create_issue","input":{"title":"..."}}]}',
    "",
    "行为规则：",
    "1. 一次只做一个 read、execute 或 execute_many。",
    "1.5. 如果当前要连续执行多个同类写动作，必须使用 execute_many，把所有 items 放进同一个 JSON object；不要输出多行 JSON，也不要一次一个地拆开。",
    "2. 缺少真实对象 ID 时，先 read，不要猜 projectId / issueId / docId / workflowId。",
    "2.5. 当用户使用项目名提问时，优先先 search_projects 找到真实 projectId；当用户说“我 / 当前由我处理”时，优先使用 get_current_actor_context 或在 list_issues 中使用 assigneeScope=ME。",
    "3. 用户想把想法落到系统里时，优先尝试 create_project / create_issue，而不是只给泛泛建议。",
    "4. 需要编码交接时，先 read 相关对象；如果要给用户展示 handoff prompt，用 assemble_coding_prompt；如果用户明确要求把 prompt 写回 issue，再 execute attach_coding_prompt_to_issue。",
    "5. 当信息已经足够时，尽快返回 final，不要无休止读取。",
    "6. 如果动作需要确认，runtime 会自动预演并展示确认卡，你只要正常返回 execute。",
    "6.5. 如果用户明确说了“直接执行 / 直接创建 / 批量创建 / 不用再确认”，runtime 可能会直接执行，不需要你额外解释审批机制。",
    "7. 对 enum 字段必须严格使用 action catalog 里给出的原始枚举值，不能自造缩写或近义词，例如不能把 TEAM_READONLY / TEAM_EDITABLE 写成 TEAM。",
    "8. 当用户只表达“团队可见”而没有说明编辑权限时，优先省略 visibility，让后端使用默认值；如果必须显式填写，优先使用 TEAM_READONLY。",
    "9. 对任何 *Id 字段都不能猜测；如果当前 read tools 还拿不到真实 ID，就先换成可执行的 read，或在 final 里明确说明缺少哪个真实 ID。",
    "",
    "Read tools:",
    buildReadToolCatalog(),
    "",
    "Available execution actions:",
    buildActionCatalog(params.manifest, params.capabilities),
  ].join("\n");
}

function buildReadToolResultText(toolName: ReadToolName, output: unknown) {
  const text =
    output && typeof output === "object" && "text" in output
      ? String((output as { text?: unknown }).text ?? "")
      : "";

  switch (toolName) {
    case "assemble_coding_prompt":
      return clipText(
        text || "已组装 coding handoff prompt，可直接复制给外部编码 agent。",
      );
    case "search_projects":
      return clipText(text || "已完成项目搜索。");
    case "list_issues":
      return clipText(text || "已按条件列出 issue。");
    case "search_docs":
      return clipText(text || "已完成文档搜索。");
    default:
      return clipText(text || `已读取 ${toolName}。`);
  }
}

function buildExecutionResultText(actionKey: string, output: {
  status: string;
  message: string;
  summary: string;
  result?: unknown;
  error?: { message?: string };
}) {
  const lines = [
    `动作 ${actionKey} 返回状态：${output.status}`,
    output.summary ? `摘要：${output.summary}` : null,
    output.message ? `消息：${output.message}` : null,
    output.error?.message ? `错误：${output.error.message}` : null,
    output.result ? `结果：${safeJson(output.result, 1800)}` : null,
  ];

  return clipText(lines.filter(Boolean).join("\n"));
}

function buildToolEventParts(event: ToolEvent): AiMessagePart[] {
  return [
    {
      type: "tool-call",
      toolCallId: event.toolCallId,
      toolName: event.toolName,
      input: event.input,
    },
    {
      type: "tool-result",
      toolCallId: event.toolCallId,
      toolName: event.toolName,
      output: event.output,
      isError: event.isError,
    },
    {
      type: "text",
      text: event.text,
    },
  ];
}

function readStringArg(input: Record<string, unknown>, key: string) {
  const value = input[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function invokeReadTool(
  toolName: ReadToolName,
  args: Record<string, unknown>,
  opts: ServerFetchOptions,
) {
  switch (toolName) {
    case "get_workspace_summary":
      return getAiWorkspaceSummary(opts);
    case "get_current_actor_context":
      return getAiActorContext(opts);
    case "search_projects":
      return searchAiProjects(opts, {
        query:
          typeof args.query === "string" ? args.query.trim() : undefined,
        limit:
          typeof args.limit === "number" && Number.isFinite(args.limit)
            ? args.limit
            : undefined,
      });
    case "get_project_detail": {
      const projectId = readStringArg(args, "projectId");
      if (!projectId) {
        throw new Error("get_project_detail 需要 projectId");
      }
      return getAiProjectDetail(opts, projectId);
    }
    case "list_issues":
      return listAiIssues(opts, {
        projectId: readStringArg(args, "projectId") ?? undefined,
        assigneeScope:
          args.assigneeScope === "ME" || args.assigneeScope === "ANY"
            ? args.assigneeScope
            : undefined,
        stateCategories: Array.isArray(args.stateCategories)
          ? args.stateCategories.filter(
              (item): item is string =>
                typeof item === "string" && item.trim().length > 0,
            )
          : undefined,
        limit:
          typeof args.limit === "number" && Number.isFinite(args.limit)
            ? args.limit
            : undefined,
      });
    case "get_issue_detail": {
      const issueId = readStringArg(args, "issueId");
      if (!issueId) {
        throw new Error("get_issue_detail 需要 issueId");
      }
      return getAiIssueDetail(opts, issueId);
    }
    case "get_workflow_run_detail": {
      const issueId = readStringArg(args, "issueId");
      if (!issueId) {
        throw new Error("get_workflow_run_detail 需要 issueId");
      }
      return getAiWorkflowRunDetail(opts, issueId);
    }
    case "search_docs":
      return searchAiDocs(opts, {
        query:
          typeof args.query === "string" ? args.query.trim() : undefined,
        limit:
          typeof args.limit === "number" && Number.isFinite(args.limit)
            ? args.limit
            : undefined,
      });
    case "get_doc_detail": {
      const docId = readStringArg(args, "docId");
      if (!docId) {
        throw new Error("get_doc_detail 需要 docId");
      }
      return getAiDocDetail(opts, docId);
    }
    case "assemble_coding_prompt": {
      const issueId = readStringArg(args, "issueId");
      if (!issueId) {
        throw new Error("assemble_coding_prompt 需要 issueId");
      }
      return assembleAiCodingPrompt(opts, issueId);
    }
    default:
      throw new Error(`未知 read tool: ${String(toolName)}`);
  }
}

async function resolveExecutionInput(
  actionKey: string,
  input: Record<string, unknown>,
  opts: ServerFetchOptions,
): Promise<{
  resolvedInput: Record<string, unknown>;
  codingPromptAssembly: AiCodingPromptAssembly | null;
}> {
  if (actionKey !== "attach_coding_prompt_to_issue") {
    return {
      resolvedInput: input,
      codingPromptAssembly: null,
    };
  }

  const issueId = readStringArg(input, "issueId");
  const existingPrompt = readStringArg(input, "prompt");

  if (!issueId) {
    throw new Error("attach_coding_prompt_to_issue 需要 issueId");
  }

  if (existingPrompt) {
    return {
      resolvedInput: input,
      codingPromptAssembly: null,
    };
  }

  const assembly = await assembleAiCodingPrompt(opts, issueId);

  return {
    resolvedInput: {
      ...input,
      issueId,
      prompt: assembly.prompt,
    },
    codingPromptAssembly: assembly,
  };
}

type ApprovalIntent = "confirm" | "reject" | null;

interface PreviewBundleItem {
  actionKey: string;
  input: Record<string, unknown>;
  summary: string;
  status: AiExecutionActionResult["status"];
  needsConfirmation: boolean;
  message: string;
  preview?: unknown;
  error?: AiExecutionActionResult["error"];
}

function isQuestionLike(text: string) {
  const normalized = text.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  return /[?？]|(为什么|怎么|如何|能不能|可不可以|可以吗|是否|要不要|需不需要|解释一下|说明一下|先.*吗)/i.test(
    normalized,
  );
}

function detectApprovalIntent(text: string): ApprovalIntent {
  const normalized = text.trim().toLowerCase();

  if (!normalized || isQuestionLike(normalized)) {
    return null;
  }

  if (/^(拒绝|取消|先别|不要执行|算了|不执行|reject|cancel)\b/i.test(normalized)) {
    return "reject";
  }

  if (
    /^(可以|好的|好|行|那就|请)?[\s，,]*(执行|确认|继续|继续执行|继续创建|开始执行|开始创建|直接执行|直接创建|同意|批准|approve|confirm|run|go ahead)\b/i.test(
      normalized,
    ) ||
    /^根据.*(执行|确认)/i.test(normalized)
  ) {
    return "confirm";
  }

  return null;
}

function allowsDirectExecution(text: string) {
  const normalized = text.trim().toLowerCase();

  if (!normalized || isQuestionLike(normalized)) {
    return false;
  }

  return /(直接执行|直接创建|直接批量创建|直接帮我创建|不用确认|无需确认|你可以直接执行|你可以直接创建|一次创建|一次性创建|一并创建|一次生成创建|batch create|go ahead|without confirmation)/i.test(
    normalized,
  );
}

async function findPendingApprovals(
  backendOptions: ServerFetchOptions,
  threadId: string,
  messages: AiMessageRecord[],
) {
  const approvalIds = Array.from(
    new Set(
      messages
        .flatMap((message) =>
          message.parts.flatMap((part) =>
            part.type === "approval-request" ? [part.approvalId] : [],
          ),
        )
        .reverse(),
    ),
  ).slice(0, 12);

  const approvals = await Promise.all(
    approvalIds.map(async (approvalId) => {
      try {
        return await getAiApproval(backendOptions, threadId, approvalId);
      } catch {
        return null;
      }
    }),
  );

  return approvals.filter(
    (approval: AiApprovalRecord | null): approval is AiApprovalRecord =>
      approval?.status === "PENDING",
  );
}

async function previewExecutionItems(
  items: ApprovalBundleItem[],
  backendOptions: ServerFetchOptions,
  threadId: string,
) {
  const previewItems: PreviewBundleItem[] = [];
  let latestCodingPrompt: AiCodingPromptAssembly | null = null;

  for (const item of items) {
    const { resolvedInput, codingPromptAssembly } = await resolveExecutionInput(
      item.actionKey,
      item.input,
      backendOptions,
    );

    if (codingPromptAssembly) {
      latestCodingPrompt = codingPromptAssembly;
    }

    const execution = await executeAiAction(backendOptions, item.actionKey, {
      input: resolvedInput,
      dryRun: true,
      conversationId: threadId,
    });

    previewItems.push({
      actionKey: item.actionKey,
      input: resolvedInput,
      summary: item.summary ?? execution.summary,
      status: execution.status,
      needsConfirmation: execution.needsConfirmation,
      message: execution.message,
      preview: execution.result,
      error: execution.error,
    });
  }

  return {
    previewItems,
    latestCodingPrompt,
  };
}

async function executeExecutionItems(
  items: ApprovalBundleItem[],
  backendOptions: ServerFetchOptions,
  threadId: string,
  confirmed: boolean,
) {
  const executedItems: Array<{
    actionKey: string;
    input: Record<string, unknown>;
    summary: string;
    execution: AiExecutionActionResult;
  }> = [];
  let latestCodingPrompt: AiCodingPromptAssembly | null = null;

  for (const item of items) {
    const { resolvedInput, codingPromptAssembly } = await resolveExecutionInput(
      item.actionKey,
      item.input,
      backendOptions,
    );

    if (codingPromptAssembly) {
      latestCodingPrompt = codingPromptAssembly;
    }

    const execution = await executeAiAction(backendOptions, item.actionKey, {
      input: resolvedInput,
      confirmed,
      conversationId: threadId,
    });

    executedItems.push({
      actionKey: item.actionKey,
      input: resolvedInput,
      summary: item.summary ?? execution.summary,
      execution,
    });
  }

  return {
    executedItems,
    latestCodingPrompt,
  };
}

function buildBatchToolText(summary: string, items: PreviewBundleItem[]) {
  return clipText(
    [
      "批量动作已完成预演。",
      `摘要：${summary}`,
      `共 ${items.length} 项，等待你的统一确认。`,
      ...items.map((item, index) => {
        const title =
          readStringArg(item.input, "title") ||
          readStringArg(item.input, "name") ||
          item.summary ||
          item.actionKey;
        return `${index + 1}. ${title}`;
      }),
    ].join("\n"),
    2400,
  );
}

function buildBatchToolOutput(summary: string, items: PreviewBundleItem[]) {
  return {
    status: "preview" as const,
    message: "已完成批量预演，等待确认。",
    summary,
    needsConfirmation: true,
    targetId: null,
    approvalMode: "CONFIRM" as const,
    action: {
      key: "execute_many",
      label: "批量执行动作",
      description: "按顺序执行一组动作。",
      area: "issue" as const,
      targetType: "WORKSPACE" as const,
      approvalMode: "CONFIRM" as const,
      requiresTargetId: false,
      fields: [],
      sampleInput: {},
    },
    result: {
      total: items.length,
      items,
    },
  };
}

function buildBatchAssistantText(
  items: Array<{
    actionKey: string;
    summary: string;
    input: Record<string, unknown>;
    execution: AiExecutionActionResult;
  }>,
) {
  const successCount = items.filter(
    (item) => item.execution.status === "succeeded",
  ).length;
  const failedCount = items.length - successCount;

  if (failedCount === 0) {
    return `这批动作已经执行完成，共 ${items.length} 项。`;
  }

  return `这批动作已执行完毕，共 ${items.length} 项，成功 ${successCount} 项，失败 ${failedCount} 项。`;
}

function buildExecutedBatchToolText(
  summary: string,
  items: Array<{
    actionKey: string;
    summary: string;
    input: Record<string, unknown>;
    execution: AiExecutionActionResult;
  }>,
) {
  const successCount = items.filter(
    (item) => item.execution.status === "succeeded",
  ).length;
  const failedCount = items.length - successCount;

  return clipText(
    [
      "批量动作已执行完成。",
      `摘要：${summary}`,
      `共 ${items.length} 项，成功 ${successCount} 项，失败 ${failedCount} 项。`,
      ...items.map((item, index) => {
        const title =
          readStringArg(item.input, "title") ||
          readStringArg(item.input, "name") ||
          item.summary ||
          item.actionKey;
        const suffix =
          item.execution.status === "succeeded"
            ? "成功"
            : `失败：${item.execution.error?.message ?? item.execution.message}`;
        return `${index + 1}. ${title} - ${suffix}`;
      }),
    ].join("\n"),
    2600,
  );
}

function buildExecutedBatchToolOutput(
  summary: string,
  items: Array<{
    actionKey: string;
    summary: string;
    input: Record<string, unknown>;
    execution: AiExecutionActionResult;
  }>,
) {
  const successCount = items.filter(
    (item) => item.execution.status === "succeeded",
  ).length;
  const failedCount = items.length - successCount;

  return {
    status: failedCount === 0 ? "succeeded" : "failed",
    message:
      failedCount === 0
        ? `批量动作执行成功，共 ${items.length} 项。`
        : `批量动作执行完成，共 ${items.length} 项，失败 ${failedCount} 项。`,
    summary,
    needsConfirmation: false,
    targetId: null,
    approvalMode: "CONFIRM" as const,
    action: {
      key: "execute_many",
      label: "批量执行动作",
      description: "按顺序执行一组动作。",
      area: "issue" as const,
      targetType: "WORKSPACE" as const,
      approvalMode: "CONFIRM" as const,
      requiresTargetId: false,
      fields: [],
      sampleInput: {},
    },
    result: {
      total: items.length,
      succeeded: successCount,
      failed: failedCount,
      items: items.map((item) => ({
        actionKey: item.actionKey,
        summary: item.summary,
        input: item.input,
        status: item.execution.status,
        message: item.execution.message,
        result: item.execution.result,
        error: item.execution.error,
      })),
    },
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
  try {
    const token = extractBearerToken(request);
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const cursor = searchParams.get("cursor") || undefined;
    const { threadId } = await context.params;

    if (!workspaceId) {
      return NextResponse.json(
        { message: "缺少 workspaceId。" },
        { status: 400 },
      );
    }

    const messages = await listAiThreadMessages(
      {
        token,
        workspaceId,
        signal: request.signal,
      },
      threadId,
      cursor,
    );

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "获取消息历史失败" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
  const { threadId } = await context.params;
  let runId: string | null = null;
  let workspaceId = "";
  let token = "";

  const finishRunAsFailed = async (error: unknown) => {
    if (!runId || !workspaceId || !token) {
      return;
    }

    try {
      await finishAiRun(
        {
          token,
          workspaceId,
        },
        threadId,
        runId,
        {
          status: "FAILED",
          lastError: toErrorPayload(error),
        },
      );
    } catch (finishError) {
      console.error("[ai-runtime] finish failed run error", finishError);
    }
  };

  try {
    token = extractBearerToken(request);
    const payload = sendMessageSchema.parse(await request.json());
    workspaceId = payload.workspaceId;

    const backendOptions = {
      token,
      workspaceId,
      signal: request.signal,
    } satisfies ServerFetchOptions;
    const durableBackendOptions = {
      token,
      workspaceId,
    } satisfies ServerFetchOptions;

    const thread = await getAiThread(backendOptions, threadId);

    await appendAiMessage(backendOptions, threadId, {
      role: "USER",
      parts: [
        {
          type: "text",
          text: payload.text,
        },
      ],
    });

    const historyPage = await listAiThreadMessages(backendOptions, threadId);
    const approvalIntent = detectApprovalIntent(payload.text);
    const directExecutionAllowed = allowsDirectExecution(payload.text);

    if (approvalIntent) {
      const pendingApprovals = await findPendingApprovals(
        backendOptions,
        threadId,
        historyPage.items,
      );

      if (pendingApprovals.length === 1) {
        if (approvalIntent === "confirm") {
          const result = await confirmAndExecuteApproval(
            durableBackendOptions,
            threadId,
            pendingApprovals[0].id,
          );

          return new Response(result.assistantText, {
            headers: {
              "Cache-Control": "no-store",
              "Content-Type": "text/plain; charset=utf-8",
            },
          });
        }

        await rejectApprovalWithMessage(
          durableBackendOptions,
          threadId,
          pendingApprovals[0].id,
        );

        return new Response("已经按你的要求取消待执行动作。", {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      if (pendingApprovals.length > 1) {
        const clarificationText =
          "当前线程里还有多个待确认动作。请直接点击对应确认卡，或明确说明要执行哪一组动作。";

        await appendAiMessage(durableBackendOptions, threadId, {
          role: "ASSISTANT",
          parts: [
            {
              type: "text",
              text: clarificationText,
            },
          ],
        });

        return new Response(clarificationText, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }
    }

    const run = await startAiRun(backendOptions, threadId, {
      model: DEFAULT_AI_MODEL_ID,
      maxSteps: MAX_AGENT_STEPS,
    });
    runId = run.id;

    const [manifest, capabilities] = await Promise.all([
      getAiExecutionManifest(backendOptions),
      getAiExecutionCapabilities(backendOptions),
    ]);

    let surfaceSummaryText = "";

    const threadPins = Array.isArray(thread.pins) ? thread.pins : [];

    if (threadPins.length > 0) {
      try {
        const summaries = await postAiSurfaceSummaries(backendOptions, {
          pins: threadPins.map((pin) => ({
            surfaceType: pin.surfaceType,
            surfaceId: pin.surfaceId,
          })),
        });
        surfaceSummaryText = buildSummaryMessage(summaries);
      } catch (summaryError) {
        console.warn("[ai-runtime] surface summaries unavailable", summaryError);
      }
    }

    const runtimeContext = createRuntimeContext({
      workspaceId,
      thread,
    });
    const baseSystemPrompt = buildAiSystemPrompt(runtimeContext);
    const agentSystemPrompt = buildDecisionSystemPrompt({
      baseSystemPrompt,
      manifest,
      capabilities,
    });

    const historyMessages = toRuntimeMessages(historyPage.items);
    const toolContextMessages: AiRuntimeMessage[] = surfaceSummaryText
      ? [{ role: "system", content: surfaceSummaryText }]
      : [];
    let stepIndex = 0;
    let totalTokensUsed = 0;
    let latestCodingPrompt: AiCodingPromptAssembly | null = null;
    let lastToolText = "";

    for (let iteration = 0; iteration < MAX_AGENT_STEPS; iteration += 1) {
      const llmMessages = [...toolContextMessages, ...historyMessages];
      const llmResult = await generateAiText({
        system: agentSystemPrompt,
        messages: llmMessages,
        runtimeContext,
        signal: request.signal,
        maxTokens: 1400,
        temperature: 0.1,
      });

      totalTokensUsed += llmResult.usage?.totalTokens ?? 0;

      await recordAiRunStep(durableBackendOptions, threadId, run.id, {
        kind: "LLM_CALL",
        stepIndex,
        model: DEFAULT_AI_MODEL_ID,
        promptSnapshot: {
          system: agentSystemPrompt,
          messages: llmMessages,
        },
        responseSnapshot: {
          text: llmResult.text,
        },
        tokensIn: llmResult.usage?.inputTokens,
        tokensOut: llmResult.usage?.outputTokens,
      });
      stepIndex += 1;

      const decision = parseAgentDecision(llmResult.text);

      if (decision.type === "final") {
        const assistantParts: AiMessagePart[] = [
          {
            type: "text",
            text: decision.reply,
          },
        ];

        if (latestCodingPrompt) {
          assistantParts.push({
            type: "coding-prompt",
            issueId: latestCodingPrompt.issueId,
            prompt: latestCodingPrompt.prompt,
            generatedAt: new Date().toISOString(),
          });
        }

        await appendAiMessage(durableBackendOptions, threadId, {
          role: "ASSISTANT",
          runId: run.id,
          parts: assistantParts,
        });

        await finishAiRun(durableBackendOptions, threadId, run.id, {
          status: "COMPLETED",
          tokensUsed: totalTokensUsed,
        });

        return new Response(decision.reply, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      if (decision.type === "read") {
        const toolOutput = await invokeReadTool(
          decision.tool,
          decision.arguments,
          backendOptions,
        );
        const toolText = buildReadToolResultText(decision.tool, toolOutput);
        const toolEvent: ToolEvent = {
          toolCallId: `tool-${run.id}-${stepIndex}`,
          toolName: decision.tool,
          input: decision.arguments,
          output: toolOutput,
          text: toolText,
        };

        if (decision.tool === "assemble_coding_prompt") {
          latestCodingPrompt = toolOutput as AiCodingPromptAssembly;
        }

        await appendAiMessage(durableBackendOptions, threadId, {
          role: "TOOL",
          runId: run.id,
          parts: buildToolEventParts(toolEvent),
        });

        await recordAiRunStep(durableBackendOptions, threadId, run.id, {
          kind: "TOOL_CALL",
          stepIndex,
          toolName: decision.tool,
          toolInput: decision.arguments,
          toolOutput,
        });
        stepIndex += 1;

        toolContextMessages.unshift({
          role: "system",
          content: `工具 ${decision.tool} 返回：\n${toolText}`,
        });
        lastToolText = toolText;
        continue;
      }

      if (decision.type === "execute_many") {
        const batchItems = decision.items.map(
          (item): ApprovalBundleItem => ({
            actionKey: item.actionKey,
            input: item.input,
            summary: item.summary,
          }),
        );

        for (const item of batchItems) {
          if (!EXECUTION_ACTION_ALLOWLIST.has(item.actionKey)) {
            throw new Error(`当前 runtime 暂未开放动作 ${item.actionKey}`);
          }
        }

        const batchSummary =
          decision.summary?.trim() || `批量执行 ${batchItems.length} 个动作`;

        if (directExecutionAllowed) {
          const { executedItems, latestCodingPrompt: batchCodingPrompt } =
            await executeExecutionItems(
              batchItems,
              backendOptions,
              threadId,
              true,
            );

          if (batchCodingPrompt) {
            latestCodingPrompt = batchCodingPrompt;
          }

          const toolOutput = buildExecutedBatchToolOutput(
            batchSummary,
            executedItems,
          );
          const toolText = buildExecutedBatchToolText(
            batchSummary,
            executedItems,
          );
          const toolEvent: ToolEvent = {
            toolCallId: `tool-${run.id}-${stepIndex}`,
            toolName: "action:execute_many",
            input: {
              items: executedItems.map((item) => ({
                actionKey: item.actionKey,
                input: item.input,
                summary: item.summary,
              })),
            },
            output: toolOutput,
            isError: toolOutput.status !== "succeeded",
            text: toolText,
          };

          await appendAiMessage(durableBackendOptions, threadId, {
            role: "TOOL",
            runId: run.id,
            parts: buildToolEventParts(toolEvent),
          });

          await recordAiRunStep(durableBackendOptions, threadId, run.id, {
            kind: "TOOL_CALL",
            stepIndex,
            toolName: "execute_many",
            toolInput: toolEvent.input,
            toolOutput,
          });
          stepIndex += 1;

          const assistantText = buildBatchAssistantText(executedItems);
          const assistantParts: AiMessagePart[] = [
            {
              type: "text",
              text: assistantText,
            },
          ];

          if (latestCodingPrompt) {
            assistantParts.push({
              type: "coding-prompt",
              issueId: latestCodingPrompt.issueId,
              prompt: latestCodingPrompt.prompt,
              generatedAt: new Date().toISOString(),
            });
          }

          await appendAiMessage(durableBackendOptions, threadId, {
            role: "ASSISTANT",
            runId: run.id,
            parts: assistantParts,
          });

          await finishAiRun(durableBackendOptions, threadId, run.id, {
            status:
              toolOutput.status === "succeeded" ? "COMPLETED" : "FAILED",
            tokensUsed: totalTokensUsed,
          });

          return new Response(assistantText, {
            headers: {
              "Cache-Control": "no-store",
              "Content-Type": "text/plain; charset=utf-8",
            },
          });
        }

        const { previewItems, latestCodingPrompt: batchCodingPrompt } =
          await previewExecutionItems(batchItems, backendOptions, threadId);

        if (batchCodingPrompt) {
          latestCodingPrompt = batchCodingPrompt;
        }

        const previewNeedsApproval = previewItems.some(
          (item) => item.needsConfirmation,
        );

        if (!previewNeedsApproval) {
          const { executedItems, latestCodingPrompt: directBatchCodingPrompt } =
            await executeExecutionItems(
              batchItems,
              backendOptions,
              threadId,
              false,
            );

          if (directBatchCodingPrompt) {
            latestCodingPrompt = directBatchCodingPrompt;
          }

          const toolOutput = buildExecutedBatchToolOutput(
            batchSummary,
            executedItems,
          );
          const toolText = buildExecutedBatchToolText(
            batchSummary,
            executedItems,
          );
          const toolEvent: ToolEvent = {
            toolCallId: `tool-${run.id}-${stepIndex}`,
            toolName: "action:execute_many",
            input: {
              items: executedItems.map((item) => ({
                actionKey: item.actionKey,
                input: item.input,
                summary: item.summary,
              })),
            },
            output: toolOutput,
            isError: toolOutput.status !== "succeeded",
            text: toolText,
          };

          await appendAiMessage(durableBackendOptions, threadId, {
            role: "TOOL",
            runId: run.id,
            parts: buildToolEventParts(toolEvent),
          });

          await recordAiRunStep(durableBackendOptions, threadId, run.id, {
            kind: "TOOL_CALL",
            stepIndex,
            toolName: "execute_many",
            toolInput: toolEvent.input,
            toolOutput,
          });
          stepIndex += 1;

          toolContextMessages.unshift({
            role: "system",
            content: `动作 execute_many 返回：\n${toolText}`,
          });
          lastToolText = toolText;
          continue;
        }

        const previewOutput = buildBatchToolOutput(batchSummary, previewItems);
        const previewText = buildBatchToolText(batchSummary, previewItems);
        const previewInput = {
          kind: "batch" as const,
          summary: batchSummary,
          items: previewItems.map((item) => ({
            actionKey: item.actionKey,
            input: item.input,
            summary: item.summary,
          })),
        };
        const previewEvent: ToolEvent = {
          toolCallId: `tool-${run.id}-${stepIndex}`,
          toolName: "action:execute_many",
          input: {
            items: batchItems,
          },
          output: previewOutput,
          text: previewText,
        };

        await appendAiMessage(durableBackendOptions, threadId, {
          role: "TOOL",
          runId: run.id,
          parts: buildToolEventParts(previewEvent),
        });

        await recordAiRunStep(durableBackendOptions, threadId, run.id, {
          kind: "TOOL_CALL",
          stepIndex,
          toolName: "execute_many",
          toolInput: previewEvent.input,
          toolOutput: previewOutput,
        });
        stepIndex += 1;

        const approval = await createAiApproval(
          durableBackendOptions,
          threadId,
          {
            runId: run.id,
            actionKey: "execute_many",
            summary: batchSummary,
            input: previewInput,
            previewResult: previewOutput.result,
          },
        );

        const assistantText = "这批动作已经准备好，确认一次后我会一起执行。";
        const assistantParts: AiMessagePart[] = [
          {
            type: "text",
            text: assistantText,
          },
          {
            type: "approval-request",
            approvalId: approval.id,
            actionKey: "execute_many",
            summary: batchSummary,
            input: previewInput,
            preview: previewOutput.result,
            items: previewItems.map((item) => ({
              actionKey: item.actionKey,
              summary: item.summary,
              input: item.input,
              preview: item.preview,
              status: item.status,
              message: item.message,
              error: item.error,
            })),
            status: "PENDING",
          },
        ];

        if (latestCodingPrompt) {
          assistantParts.push({
            type: "coding-prompt",
            issueId: latestCodingPrompt.issueId,
            prompt: latestCodingPrompt.prompt,
            generatedAt: new Date().toISOString(),
          });
        }

        await appendAiMessage(durableBackendOptions, threadId, {
          role: "ASSISTANT",
          runId: run.id,
          parts: assistantParts,
        });

        await finishAiRun(durableBackendOptions, threadId, run.id, {
          status: "WAITING_APPROVAL",
          tokensUsed: totalTokensUsed,
        });

        return new Response(assistantText, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      if (!EXECUTION_ACTION_ALLOWLIST.has(decision.actionKey)) {
        throw new Error(`当前 runtime 暂未开放动作 ${decision.actionKey}`);
      }

      const { resolvedInput, codingPromptAssembly } = await resolveExecutionInput(
        decision.actionKey,
        decision.input,
        backendOptions,
      );

      if (codingPromptAssembly) {
        latestCodingPrompt = codingPromptAssembly;
      }

      const execution = await executeAiAction(
        backendOptions,
        decision.actionKey,
        {
          input: resolvedInput,
          confirmed: directExecutionAllowed,
          conversationId: threadId,
        },
      );

      const toolText = buildExecutionResultText(decision.actionKey, execution);
      const toolEvent: ToolEvent = {
        toolCallId: `tool-${run.id}-${stepIndex}`,
        toolName: `action:${decision.actionKey}`,
        input: resolvedInput,
        output: execution,
        isError:
          execution.status === "failed" || execution.status === "blocked",
        text: toolText,
      };

      await appendAiMessage(durableBackendOptions, threadId, {
        role: "TOOL",
        runId: run.id,
        parts: buildToolEventParts(toolEvent),
      });

      await recordAiRunStep(durableBackendOptions, threadId, run.id, {
        kind: "TOOL_CALL",
        stepIndex,
        toolName: decision.actionKey,
        toolInput: resolvedInput,
        toolOutput: execution,
      });
      stepIndex += 1;

      toolContextMessages.unshift({
        role: "system",
        content: `动作 ${decision.actionKey} 返回：\n${toolText}`,
      });
      lastToolText = toolText;

      if (execution.needsConfirmation) {
        const approvalPreview = {
          summary: execution.summary,
          message: execution.message,
          input: resolvedInput,
          preview: execution.result ?? null,
        };

        const approval = await createAiApproval(
          durableBackendOptions,
          threadId,
          {
            runId: run.id,
            actionKey: decision.actionKey,
            summary: execution.summary,
            input: resolvedInput,
            previewResult: approvalPreview,
          },
        );

        const assistantText =
          execution.message || "我已经准备好一个需要你确认的动作。";
        const assistantParts: AiMessagePart[] = [
          {
            type: "text",
            text: assistantText,
          },
          {
            type: "approval-request",
            approvalId: approval.id,
            actionKey: decision.actionKey,
            summary: execution.summary,
            input: resolvedInput,
            preview: approvalPreview,
            status: "PENDING",
          },
        ];

        if (latestCodingPrompt) {
          assistantParts.push({
            type: "coding-prompt",
            issueId: latestCodingPrompt.issueId,
            prompt: latestCodingPrompt.prompt,
            generatedAt: new Date().toISOString(),
          });
        }

        await appendAiMessage(durableBackendOptions, threadId, {
          role: "ASSISTANT",
          runId: run.id,
          parts: assistantParts,
        });

        await finishAiRun(durableBackendOptions, threadId, run.id, {
          status: "WAITING_APPROVAL",
          tokensUsed: totalTokensUsed,
        });

        return new Response(assistantText, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }
    }

    const fallbackText =
      lastToolText ||
      "我已经处理完本轮上下文，但还没有得到更明确的下一步。你可以继续补充要创建的对象、目标项目，或确认我刚才读取到的信息。";
    const fallbackParts: AiMessagePart[] = [
      {
        type: "text",
        text: fallbackText,
      },
    ];

    if (latestCodingPrompt) {
      fallbackParts.push({
        type: "coding-prompt",
        issueId: latestCodingPrompt.issueId,
        prompt: latestCodingPrompt.prompt,
        generatedAt: new Date().toISOString(),
      });
    }

    await appendAiMessage(durableBackendOptions, threadId, {
      role: "ASSISTANT",
      runId: run.id,
      parts: fallbackParts,
    });

    await finishAiRun(durableBackendOptions, threadId, run.id, {
      status: "COMPLETED",
      tokensUsed: totalTokensUsed,
    });

    return new Response(fallbackText, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    await finishRunAsFailed(error);

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "发送 AI 消息失败" },
      { status: 500 },
    );
  }
}
