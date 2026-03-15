import { cn } from "@/lib/utils";
import { DashboardMetric } from "./types";

interface DashboardMetricGridProps {
  metrics: DashboardMetric[];
}

function toneClass(tone: DashboardMetric["tone"]) {
  if (tone === "positive") {
    return "text-emerald-500";
  }
  if (tone === "warning") {
    return "text-orange-500";
  }

  return "text-muted-foreground";
}

export function DashboardMetricGrid({ metrics }: DashboardMetricGridProps) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.id || metric.label}
          className="rounded-xl border border-app-border bg-app-content-bg p-4 transition-colors hover:bg-app-bg"
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{metric.value}</p>
          <p className={cn("mt-1 text-xs", toneClass(metric.tone))}>{metric.trend} vs last period</p>

          {metric.sparkline && metric.sparkline.length > 0 && (
            <div className="mt-3 flex h-8 items-end gap-1">
              {metric.sparkline.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-sm bg-primary/30"
                  style={{ height: `${Math.max(8, Math.min(100, value))}%` }}
                />
              ))}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
