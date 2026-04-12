"use client";

import type {
  AiApprovalRequestPart,
  AiMessagePart,
  AiMessageRecord,
  AiToolResultPart,
} from "@/lib/ai/types";

function getPrettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getToolSummary(part: AiToolResultPart) {
  if (
    part.output &&
    typeof part.output === "object" &&
    !Array.isArray(part.output)
  ) {
    const output = part.output as {
      message?: unknown;
      summary?: unknown;
      status?: unknown;
    };

    const lines = [
      typeof output.status === "string" ? `状态：${output.status}` : null,
      typeof output.summary === "string" ? `摘要：${output.summary}` : null,
      typeof output.message === "string" ? `消息：${output.message}` : null,
    ].filter(Boolean);

    if (lines.length > 0) {
      return lines.join("\n");
    }
  }

  return part.isError ? "工具执行失败。" : "工具执行完成。";
}

function getApprovalSummary(part: AiApprovalRequestPart) {
  const lines = [
    part.summary ? `摘要：${part.summary}` : null,
    `动作：${part.actionKey}`,
    Array.isArray(part.items) && part.items.length > 0
      ? `批量动作：${part.items.length} 项`
      : null,
  ].filter(Boolean);

  return lines.join("\n");
}

function getPartText(part: AiMessagePart) {
  switch (part.type) {
    case "text":
      return part.text;
    case "error":
      return `错误：${part.message}`;
    case "context-chip":
      return `上下文：${part.label}`;
    case "tool-result":
      return `工具 ${part.toolName}\n${getToolSummary(part)}\n${getPrettyJson(
        part.output,
      )}`;
    case "approval-request":
      return `审批请求\n${getApprovalSummary(part)}`;
    case "coding-prompt":
      return `编码 Prompt\n${part.prompt}`;
    case "tool-call":
      return "";
    default:
      return "";
  }
}

export function getAiMessagePlainText(message: AiMessageRecord) {
  const body = message.parts
    .map((part) => getPartText(part))
    .filter(Boolean)
    .join("\n\n")
    .trim();

  return body || "暂无内容";
}

export function getAiMessageRoleLabel(message: AiMessageRecord) {
  switch (message.role) {
    case "USER":
      return "用户";
    case "ASSISTANT":
      return "AI 助手";
    case "SYSTEM":
      return "系统";
    case "TOOL":
      return "工具";
    default:
      return "消息";
  }
}

export function getAiMessageSelectionText(message: AiMessageRecord) {
  return `${getAiMessageRoleLabel(message)}:\n${getAiMessagePlainText(message)}`;
}

export function getAiMessagePreviewTitle(message: AiMessageRecord) {
  const text = getAiMessagePlainText(message).replace(/\s+/g, " ").trim();

  if (!text) {
    return getAiMessageRoleLabel(message);
  }

  return text.length > 56 ? `${text.slice(0, 56)}...` : text;
}
