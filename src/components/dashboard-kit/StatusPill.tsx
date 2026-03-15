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
    normalized.includes("online")
  ) {
    return "positive";
  }

  if (
    normalized.includes("review") ||
    normalized.includes("pending") ||
    normalized.includes("processing") ||
    normalized.includes("warning") ||
    normalized.includes("paused")
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
