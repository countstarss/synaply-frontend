import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusPillProps {
  status: string;
  className?: string;
}

function getTone(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("active") ||
    normalized.includes("healthy") ||
    normalized.includes("published") ||
    normalized.includes("completed") ||
    normalized.includes("online") ||
    status.includes("已通过") ||
    status.includes("已完成") ||
    status.includes("活跃") ||
    status.includes("已留痕") ||
    status.includes("已支付") ||
    status.includes("已确认") ||
    status.includes("已完整")
  ) {
    return "positive";
  }

  if (
    normalized.includes("review") ||
    normalized.includes("pending") ||
    normalized.includes("processing") ||
    normalized.includes("warning") ||
    normalized.includes("paused") ||
    status.includes("待") ||
    status.includes("处理中") ||
    status.includes("需") ||
    status.includes("高风险") ||
    status.includes("暂停") ||
    status.includes("未") ||
    status.includes("复核")
  ) {
    return "warning";
  }

  return "neutral";
}

export function StatusPill({ status, className }: StatusPillProps) {
  const tone = getTone(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2 py-0.5 text-[11px] font-medium",
        tone === "positive" && "border-emerald-500/40 text-emerald-500",
        tone === "warning" && "border-orange-500/40 text-orange-500",
        tone === "neutral" && "border-app-border text-muted-foreground",
        className,
      )}
    >
      {status}
    </Badge>
  );
}
