import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, WandSparkles } from "lucide-react";

interface DashboardPageHeaderProps {
  badge: string;
  title: string;
  description: string;
  primaryAction: string;
  secondaryAction: string;
}

export function DashboardPageHeader({
  badge,
  title,
  description,
  primaryAction,
  secondaryAction,
}: DashboardPageHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-app-border bg-app-content-bg p-6">
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary" className="px-2 py-1 text-xs font-medium tracking-wide">
            {badge}
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="gap-2">
            <WandSparkles className="h-4 w-4" />
            {secondaryAction}
          </Button>
          <Button className="gap-2">
            {primaryAction}
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
