import { Button } from "@/components/ui/button";
import { Bolt, CheckCircle2, Keyboard } from "lucide-react";
import { DashboardQuickAction } from "./types";

interface DashboardActionBoardProps {
  title: string;
  checklist: string[];
  actions: DashboardQuickAction[];
}

export function DashboardActionBoard({
  title,
  checklist,
  actions,
}: DashboardActionBoardProps) {
  return (
    <section className="rounded-xl border border-app-border bg-app-content-bg p-5">
      <div className="mb-4 flex items-center gap-2">
        <Bolt className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>

      <div className="space-y-3">
        {checklist.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2 border-t border-app-border pt-4">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="ghost"
            className="h-auto w-full items-start justify-between rounded-lg border border-transparent px-3 py-2 text-left hover:border-app-border hover:bg-app-bg"
          >
            <span>
              <span className="block text-sm font-medium">{action.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{action.description}</span>
            </span>
            {action.shortcut ? (
              <span className="inline-flex items-center gap-1 rounded border border-app-border px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                <Keyboard className="h-3 w-3" />
                {action.shortcut}
              </span>
            ) : null}
          </Button>
        ))}
      </div>
    </section>
  );
}
