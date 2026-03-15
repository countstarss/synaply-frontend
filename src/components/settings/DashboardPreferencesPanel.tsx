"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_DASHBOARD_DATA,
  ADMIN_MODULES,
  DashboardLandingModule,
} from "@/lib/data/admin-data";
import {
  DashboardSegmentKey,
  getDashboardMetricId,
  useDashboardPreferencesStore,
} from "@/stores/dashboard-preferences";

interface DashboardPreferencesPanelProps {
  compact?: boolean;
}

export function DashboardPreferencesPanel({
  compact = false,
}: DashboardPreferencesPanelProps) {
  const {
    visibleMetricIds,
    customMetrics,
    activeSegment,
    landingModule,
    showTimeline,
    showQuickActions,
    compactDensity,
    setMetricVisibility,
    addCustomMetric,
    removeCustomMetric,
    setActiveSegment,
    setLandingModule,
    setShowTimeline,
    setShowQuickActions,
    setCompactDensity,
    resetDashboardPreferences,
  } = useDashboardPreferencesStore();

  const baseMetrics = useMemo(
    () =>
      ADMIN_DASHBOARD_DATA.metrics.map((metric) => ({
        ...metric,
        id: getDashboardMetricId(metric),
      })),
    [],
  );

  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [trend, setTrend] = useState("+0.0%");
  const [tone, setTone] = useState<"positive" | "neutral" | "warning">(
    "neutral",
  );
  const [formula, setFormula] = useState("");

  const handleAddCustomMetric = () => {
    if (!label.trim() || !value.trim() || !trend.trim()) {
      toast.error("Please fill label, value, and trend.");
      return;
    }

    addCustomMetric({
      label: label.trim(),
      value: value.trim(),
      trend: trend.trim(),
      tone,
      formula: formula.trim() || undefined,
    });

    setLabel("");
    setValue("");
    setTrend("+0.0%");
    setTone("neutral");
    setFormula("");

    toast.success("Custom metric added to dashboard.");
  };

  const Wrapper = compact ? "div" : Card;
  const wrapperClass = compact ? "space-y-5" : "border-app-border bg-app-content-bg";

  return (
    <Wrapper className={wrapperClass}>
      {compact ? null : (
        <CardHeader>
          <CardTitle>Dashboard Preferences</CardTitle>
        </CardHeader>
      )}

      <CardContent className={compact ? "space-y-5 px-0" : "space-y-5"}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-app-border bg-app-bg p-3">
            <Label className="text-xs text-muted-foreground">Default Segment</Label>
              <Select
                value={activeSegment}
                onValueChange={(value) =>
                  setActiveSegment(value as DashboardSegmentKey)
                }
              >
              <SelectTrigger className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-app-border bg-app-bg p-3">
            <Label className="text-xs text-muted-foreground">Default Landing Module</Label>
            <Select
              value={landingModule}
              onValueChange={(value) =>
                setLandingModule(value as DashboardLandingModule)
              }
            >
              <SelectTrigger className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_MODULES.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-app-border bg-app-bg p-3">
            <Label className="text-xs text-muted-foreground">Display Options</Label>
            <div className="mt-2 space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={showTimeline}
                  onCheckedChange={(checked) => setShowTimeline(checked === true)}
                />
                <span>Show timeline panel</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={showQuickActions}
                  onCheckedChange={(checked) =>
                    setShowQuickActions(checked === true)
                  }
                />
                <span>Show action board</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={compactDensity}
                  onCheckedChange={(checked) => setCompactDensity(checked === true)}
                />
                <span>Use compact density</span>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-app-border p-4">
          <h3 className="text-sm font-semibold">Visible Base Metrics</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Hide metrics you do not need for your product context.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {baseMetrics.map((metric) => {
              const id = getDashboardMetricId(metric);
              const checked = visibleMetricIds.includes(id);

              return (
                <label
                  key={id}
                  className="flex items-center justify-between rounded-md border border-app-border px-3 py-2 text-sm"
                >
                  <span>{metric.label}</span>
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(next) =>
                      setMetricVisibility(id, next === true)
                    }
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-app-border p-4">
          <h3 className="text-sm font-semibold">Custom Metrics</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Add composed indicators and expose them directly on the dashboard.
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="custom-metric-label">Metric Label</Label>
              <Input
                id="custom-metric-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Qualified Pipeline"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-metric-value">Metric Value</Label>
              <Input
                id="custom-metric-value"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="$2.4M"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-metric-trend">Trend</Label>
              <Input
                id="custom-metric-trend"
                value={trend}
                onChange={(event) => setTrend(event.target.value)}
                placeholder="+12.4%"
              />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select
                value={tone}
                onValueChange={(next) =>
                  setTone(next as "positive" | "neutral" | "warning")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <Label htmlFor="custom-metric-formula">Formula (Optional)</Label>
            <Textarea
              id="custom-metric-formula"
              value={formula}
              onChange={(event) => setFormula(event.target.value)}
              placeholder="(Qualified leads * avg contract value) / 100"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" onClick={handleAddCustomMetric}>
              Add custom metric
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetDashboardPreferences}
            >
              Reset dashboard preferences
            </Button>
          </div>

          {customMetrics.length > 0 ? <Separator className="my-4" /> : null}

          <div className="space-y-2">
            {customMetrics.map((metric) => {
              const id = getDashboardMetricId(metric);

              return (
                <div
                  key={id}
                  className="flex items-start justify-between gap-3 rounded-md border border-app-border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{metric.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {metric.value} · {metric.trend}
                    </p>
                    {metric.formula ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Formula: {metric.formula}
                      </p>
                    ) : null}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomMetric(id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Wrapper>
  );
}
