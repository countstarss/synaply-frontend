import { NextResponse } from "next/server";
import { z } from "zod";
import { appendAiMessage, rejectAiApproval } from "@/lib/ai/backend";
import { extractBearerToken } from "@/lib/ai/runtime/context";

const approvalActionSchema = z.object({
  workspaceId: z.string().trim().min(1),
});

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

    const approval = await rejectAiApproval(backendOptions, threadId, approvalId);

    await appendAiMessage(
      {
        token,
        workspaceId: payload.workspaceId,
      },
      threadId,
      {
        role: "SYSTEM",
        runId: approval.runId,
        parts: [
          {
            type: "error",
            message: approval.summary
              ? `你已拒绝动作：${approval.summary}`
              : `你已拒绝动作 ${approval.actionKey}`,
          },
        ],
      },
    );

    return NextResponse.json(approval);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "拒绝审批失败" },
      { status: 500 },
    );
  }
}
