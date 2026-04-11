import { NextResponse } from "next/server";
import { z } from "zod";
import { confirmAiApproval } from "@/lib/ai/backend";
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
    const approval = await confirmAiApproval(
      {
        token,
        workspaceId: payload.workspaceId,
        signal: request.signal,
      },
      threadId,
      approvalId,
    );

    return NextResponse.json(approval);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "确认审批失败" },
      { status: 500 },
    );
  }
}
