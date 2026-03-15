import { Button } from "@/components/ui/button";
import { Clock3 } from "lucide-react";
import { DashboardTimelineItem } from "./types";

interface TimelinePanelProps {
  title: string;
  items: DashboardTimelineItem[];
  dense?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export function TimelinePanel({
  title,
  items,
  dense = false,
  actionLabel,
  onAction,
}: TimelinePanelProps) {
  return (
    <section className="rounded-xl border border-app-border bg-app-content-bg p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {actionLabel && onAction ? (
          <Button variant="ghost" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>

      <div className={dense ? "space-y-3" : "space-y-4"}>
        {items.map((item) => (
          <article key={item.id} className="relative pl-4">
            <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary/80" />
            <p className={dense ? "text-xs font-medium" : "text-sm font-medium"}>{item.title}</p>
            <p className={dense ? "mt-1 text-[11px] text-muted-foreground" : "mt-1 text-xs text-muted-foreground"}>
              {item.detail}
            </p>
            <p className={dense ? "mt-1 text-[11px] text-muted-foreground" : "mt-1 text-xs text-muted-foreground"}>
              {item.time}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
