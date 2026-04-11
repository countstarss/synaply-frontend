import { NextResponse } from "next/server";
import { z } from "zod";
import {
  appendAiMessage,
  assembleAiCodingPrompt,
  confirmAiApproval,
  executeAiAction,
  finishAiRun,
} from "@/lib/ai/backend";
import { extractBearerToken } from "@/lib/ai/runtime/context";
import type { AiMessagePart } from "@/lib/ai/types";

const approvalActionSchema = z.object({
  workspaceId: z.string().trim().min(1),
});

function clipText(value: string, maxLength = 2000) {
  const text = value.trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(maxLength - 1, 0)).trimEnd()}…`;
}

function safeJson(value: unknown, maxLength = 1800) {
  try {
    return clipText(JSON.stringify(value, null, 2), maxLength);
  } catch {
    return clipText(String(value), maxLength);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ threadId: string; approvalId: string }> },
) {
  try {
    const token = extractBearerToken(request);
    const payload = approvalActionSchema.parse(await request.json());
    const { approvalId, threadId } = await context.params;
    const backendOptions = {
      token,
      workspaceId: payload.workspaceId,
      signal: request.signal,
    };
    const durableBackendOptions = {
      token,
      workspaceId: payload.workspaceId,
    };

    const approval = await confirmAiApproval(
      backendOptions,
      threadId,
      approvalId,
    );

    const rawInput =
      approval.input && typeof approval.input === "object"
        ? (approval.input as Record<string, unknown>)
        : {};
    let executionInput = rawInput;
    let codingPrompt: { issueId: string; prompt: string } | null = null;

    if (
      approval.actionKey === "attach_coding_prompt_to_issue" &&
      typeof executionInput.prompt !== "string"
    ) {
      const issueId =
        typeof executionInput.issueId === "string"
          ? executionInput.issueId
          : null;

      if (!issueId) {
        throw new Error("确认写入编码交接 Prompt 时缺少 issueId。");
      }

      const assembled = await assembleAiCodingPrompt(backendOptions, issueId);
      executionInput = {
        ...executionInput,
        issueId,
        prompt: assembled.prompt,
      };
      codingPrompt = {
        issueId: assembled.issueId,
        prompt: assembled.prompt,
      };
    }

    const execution = await executeAiAction(
      backendOptions,
      approval.actionKey,
      {
        input: executionInput,
        confirmed: true,
        conversationId: threadId,
      },
    );

    const toolSummary = clipText(
      [
        `动作 ${approval.actionKey} 已确认执行。`,
        approval.summary ? `摘要：${approval.summary}` : null,
        execution.message ? `消息：${execution.message}` : null,
        execution.result ? `结果：${safeJson(execution.result)}` : null,
        execution.error?.message ? `错误：${execution.error.message}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );

    const toolParts: AiMessagePart[] = [
      {
        type: "tool-call",
        toolCallId: `approval-${approval.id}`,
        toolName: `action:${approval.actionKey}`,
        input: executionInput,
      },
      {
        type: "tool-result",
        toolCallId: `approval-${approval.id}`,
        toolName: `action:${approval.actionKey}`,
        output: execution,
        isError:
          execution.status === "failed" || execution.status === "blocked",
      },
      {
        type: "text",
        text: toolSummary,
      },
    ];

    await appendAiMessage(durableBackendOptions, threadId, {
      role: "TOOL",
      runId: approval.runId,
      parts: toolParts,
    });

    const assistantParts: AiMessagePart[] = [
      {
        type: "text",
        text:
          execution.status === "succeeded"
            ? "已经按你的确认执行完成。"
            : `执行未完成：${execution.message}`,
      },
    ];

    if (codingPrompt) {
      assistantParts.push({
        type: "coding-prompt",
        issueId: codingPrompt.issueId,
        prompt: codingPrompt.prompt,
        generatedAt: new Date().toISOString(),
      });
    }

    await appendAiMessage(durableBackendOptions, threadId, {
      role: "ASSISTANT",
      runId: approval.runId,
      parts: assistantParts,
    });

    await finishAiRun(durableBackendOptions, threadId, approval.runId, {
      status: execution.status === "succeeded" ? "COMPLETED" : "FAILED",
    });

    return NextResponse.json({
      approval,
      execution,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "确认审批失败" },
      { status: 500 },
    );
  }
}
