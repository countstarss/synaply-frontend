import { NextResponse } from "next/server";
import { z } from "zod";
import { type AiRuntimeMessage, runOnce } from "@/lib/ai/agent";
import { DEFAULT_AI_MODEL_ID } from "@/lib/ai/models";
import {
  appendAiMessage,
  finishAiRun,
  getAiThread,
  listAiThreadMessages,
  postAiSurfaceSummaries,
  recordAiRunStep,
  startAiRun,
} from "@/lib/ai/backend";
import {
  createRuntimeContext,
  extractBearerToken,
} from "@/lib/ai/runtime/context";
import { buildAiSystemPrompt } from "@/lib/ai/runtime/system-prompt";
import { getAiMessageText, type AiMessageRecord } from "@/lib/ai/types";

const sendMessageSchema = z.object({
  workspaceId: z.string().trim().min(1),
  text: z.string().trim().min(1).max(4000),
});

function toRuntimeMessages(messages: AiMessageRecord[]): AiRuntimeMessage[] {
  return messages.reduce<AiRuntimeMessage[]>((accumulator, message) => {
    const text = getAiMessageText(message.parts);

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

    if (message.role === "SYSTEM") {
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

function getUsageNumber(
  usage: Record<string, unknown> | null | undefined,
  keys: string[],
) {
  for (const key of keys) {
    const value = usage?.[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
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
    };
    const durableBackendOptions = {
      token,
      workspaceId,
    };

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

    const run = await startAiRun(backendOptions, threadId, {
      model: DEFAULT_AI_MODEL_ID,
    });
    runId = run.id;

    const historyPage = await listAiThreadMessages(backendOptions, threadId);
    let surfaceSummaryText = "";

    if (thread.pins.length > 0) {
      try {
        const summaries = await postAiSurfaceSummaries(backendOptions, {
          pins: thread.pins.map((pin) => ({
            surfaceType: pin.surfaceType,
            surfaceId: pin.surfaceId,
          })),
        });
        surfaceSummaryText = buildSummaryMessage(summaries);
      } catch (summaryError) {
        console.warn(
          "[ai-runtime] surface summaries unavailable",
          summaryError,
        );
      }
    }

    const runtimeContext = createRuntimeContext({
      workspaceId,
      thread,
    });
    const systemPrompt = buildAiSystemPrompt(runtimeContext);
    const modelMessages = toRuntimeMessages(historyPage.items);
    const messages: AiRuntimeMessage[] = surfaceSummaryText
      ? [{ role: "system", content: surfaceSummaryText }, ...modelMessages]
      : modelMessages;

    const result = runOnce({
      system: systemPrompt,
      messages,
      runtimeContext,
      signal: request.signal,
    });

    let assistantText = "";
    const textStream = new ReadableStream<string>({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            assistantText += chunk;
            controller.enqueue(chunk);
          }

          const usage = (await result.totalUsage) as
            | Record<string, unknown>
            | undefined;
          const tokensIn = getUsageNumber(usage, [
            "inputTokens",
            "promptTokens",
          ]);
          const tokensOut = getUsageNumber(usage, [
            "outputTokens",
            "completionTokens",
          ]);
          const totalTokens =
            getUsageNumber(usage, ["totalTokens"]) ??
            (tokensIn ?? 0) + (tokensOut ?? 0);

          await appendAiMessage(durableBackendOptions, threadId, {
            role: "ASSISTANT",
            runId: run.id,
            parts: [
              {
                type: "text",
                text: assistantText,
              },
            ],
          });

          await recordAiRunStep(durableBackendOptions, threadId, run.id, {
            kind: "LLM_CALL",
            stepIndex: 0,
            model: DEFAULT_AI_MODEL_ID,
            promptSnapshot: messages,
            responseSnapshot: {
              text: assistantText,
            },
            tokensIn,
            tokensOut,
          });

          await finishAiRun(durableBackendOptions, threadId, run.id, {
            status: "COMPLETED",
            tokensUsed: totalTokens,
          });
        } catch (error) {
          await finishRunAsFailed(error);
          controller.enqueue(
            "\n\n[系统提示] 本次 AI 回复未能完整保存，请稍后重试。",
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(textStream, {
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
