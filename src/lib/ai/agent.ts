import { getAiProviderConfig } from "@/lib/ai/models";
import type { AiRuntimeContext } from "@/lib/ai/runtime/context";

export interface AiRuntimeMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RunOnceInput {
  system: string;
  messages: AiRuntimeMessage[];
  runtimeContext: AiRuntimeContext;
  signal?: AbortSignal;
}

interface AnthropicContentBlock {
  type?: string;
  text?: string;
}

interface AnthropicUsage {
  input_tokens?: number;
  output_tokens?: number;
}

interface AnthropicResponse {
  content?: AnthropicContentBlock[];
  usage?: AnthropicUsage;
  error?: {
    type?: string;
    message?: string;
  };
}

function normalizeMessages(messages: AiRuntimeMessage[]) {
  const normalized: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (const message of messages) {
    const content = message.content.trim();

    if (!content || message.role === "system") {
      continue;
    }

    const previousMessage = normalized.at(-1);

    if (previousMessage?.role === message.role) {
      previousMessage.content = `${previousMessage.content}\n\n${content}`;
      continue;
    }

    normalized.push({
      role: message.role,
      content,
    });
  }

  return normalized;
}

function buildSystemPrompt(system: string, messages: AiRuntimeMessage[]) {
  return [
    system,
    ...messages
      .filter((message) => message.role === "system")
      .map((message) => message.content.trim()),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildMessagesUrl(baseUrl: string) {
  const base = baseUrl.replace(/\/+$/, "");

  if (base.endsWith("/v1/messages") || base.endsWith("/messages")) {
    return base;
  }

  if (base.endsWith("/v1")) {
    return `${base}/messages`;
  }

  return `${base}/v1/messages`;
}

function extractText(response: AnthropicResponse & Record<string, unknown>) {
  if (Array.isArray(response.content)) {
    const text = response.content
      .filter((part) => part?.type === "text" && typeof part.text === "string")
      .map((part) => part.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n\n");

    if (text) {
      return text;
    }
  }

  for (const key of ["reply", "output_text", "completion", "text"]) {
    const value = response[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  const firstChoice = Array.isArray(response.choices)
    ? response.choices[0]
    : undefined;
  const choiceContent =
    typeof firstChoice?.message?.content === "string"
      ? firstChoice.message.content
      : undefined;

  if (choiceContent?.trim()) {
    return choiceContent.trim();
  }

  throw new Error("AI 服务未返回可用文本内容。");
}

export function runOnce({
  system,
  messages,
  runtimeContext,
  signal,
}: RunOnceInput) {
  const provider = getAiProviderConfig();
  const systemPrompt = buildSystemPrompt(system, messages);
  const requestMessages = normalizeMessages(messages);

  const responsePromise = fetch(buildMessagesUrl(provider.baseUrl), {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": provider.apiKey,
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 1024,
      temperature: 0.4,
      stream: false,
      system: systemPrompt || undefined,
      messages: requestMessages,
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || `AI 服务请求失败（${response.status}）`,
        );
      }

      const payload = (await response.json()) as AnthropicResponse &
        Record<string, unknown>;

      if (payload.error?.message) {
        throw new Error(payload.error.message);
      }

      const text = extractText(payload);
      const usage = payload.usage
        ? {
            inputTokens: payload.usage.input_tokens,
            outputTokens: payload.usage.output_tokens,
            totalTokens:
              (payload.usage.input_tokens ?? 0) +
              (payload.usage.output_tokens ?? 0),
          }
        : undefined;

      return {
        text,
        usage,
      };
    })
    .catch((error) => {
      console.error("[ai-runtime] direct reply error", {
        workspaceId: runtimeContext.workspaceId,
        surface: runtimeContext.surface,
        error,
      });
      throw error;
    });

  return {
    textStream: (async function* () {
      const { text } = await responsePromise;
      yield text;
    })(),
    totalUsage: responsePromise.then((result) => result.usage),
  };
}
