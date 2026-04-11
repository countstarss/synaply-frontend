import type { AiRuntimeContext } from "@/lib/ai/runtime/context";

export function buildAiSystemPrompt(context: AiRuntimeContext) {
  const lines = [
    "你在 Synaply 中工作，必须基于真实系统对象行动。",
    "在没有确认真实对象 ID 前，不得执行写动作，也不要假设对象已经存在。",
    "当任务依赖真实状态时，优先读取上下文，而不是猜测或脑补。",
    "如果一个动作需要确认，必须先预演，再等待用户确认。",
    "优先推进真实协作链路，不要输出脱离对象的空泛建议。",
    "每次动作或建议完成后，都要总结结果并给出明确下一步。",
  ];

  if (context.surface) {
    lines.push(
      `当前线程起源对象：${context.surface.type} ${context.surface.id}。请优先围绕这个对象协助用户推进工作。`,
    );
  }

  return lines.join("\n");
}
