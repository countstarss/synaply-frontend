"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CommandPalette,
  CommandPaletteAction,
  DashboardActionBoard,
  DashboardMetric,
  DashboardMetricGrid,
  DashboardPageHeader,
  DashboardRecordsTable,
  EmptyState,
  FilterBar,
  SegmentSwitch,
  TimelinePanel,
} from "@/components/dashboard-kit";
import { Settings2 } from "lucide-react";
import { DashboardPreferencesPanel } from "@/components/settings/DashboardPreferencesPanel";
import { TEMPLATE_SCREEN_DATA } from "./template-data";
import {
  DashboardSegmentKey,
  DashboardTimeframeKey,
  getDashboardMetricId,
  useDashboardPreferencesStore,
} from "@/stores/dashboard-preferences";

const SEGMENT_OPTIONS = [
  { value: "overview", label: "Overview" },
  { value: "revenue", label: "Revenue" },
  { value: "operations", label: "Operations" },
];

const TIMEFRAME_OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
];

const DASHBOARD_SEGMENT_MAP: Record<string, DashboardSegmentKey> = {
  "active-users": "overview",
  conversion: "revenue",
  revenue: "revenue",
  churn: "operations",
};

export default function DashboardWorkbench() {
  const router = useRouter();
  const data = TEMPLATE_SCREEN_DATA.dashboard;

  const {
    visibleMetricIds,
    customMetrics,
    activeSegment,
    timeframe,
    showTimeline,
    showQuickActions,
    compactDensity,
    setActiveSegment,
    setTimeframe,
    setShowTimeline,
    setShowQuickActions,
    resetDashboardPreferences,
  } = useDashboardPreferencesStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const baseMetrics = useMemo<DashboardMetric[]>(
    () =>
      data.metrics.map((metric) => {
        const id = getDashboardMetricId(metric);
        return {
          ...metric,
          id,
          segment: metric.segment || DASHBOARD_SEGMENT_MAP[id] || "overview",
        };
      }),
    [data.metrics],
  );

  const mergedMetrics = useMemo<DashboardMetric[]>(
    () =>
      [
        ...baseMetrics,
        ...customMetrics.map((metric) => ({
          ...metric,
          id: getDashboardMetricId(metric),
          segment: metric.segment || activeSegment,
        })),
      ].filter((metric) => {
        const id = getDashboardMetricId(metric);
        if (!visibleMetricIds.includes(id)) {
          return false;
        }

        if (activeSegment === "overview") {
          return true;
        }

        return metric.segment === activeSegment || metric.segment === "overview";
      }),
    [activeSegment, baseMetrics, customMetrics, visibleMetricIds],
  );

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) {
      return data.records;
    }

    const query = searchQuery.toLowerCase();

    return data.records.filter((record) => {
      return (
        record.id.toLowerCase().includes(query) ||
        record.name.toLowerCase().includes(query) ||
        record.owner.toLowerCase().includes(query) ||
        record.status.toLowerCase().includes(query)
      );
    });
  }, [data.records, searchQuery]);

  const filteredTimeline = useMemo(() => {
    if (!searchQuery.trim()) {
      return data.timeline;
    }

    const query = searchQuery.toLowerCase();

    return data.timeline.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.detail.toLowerCase().includes(query)
      );
    });
  }, [data.timeline, searchQuery]);

  const paletteActions = useMemo<CommandPaletteAction[]>(
    () => [
      {
        id: "open-dashboard-settings",
        label: "Open dashboard settings",
        group: "Navigation",
        shortcut: "S",
        onSelect: () => router.push("/settings/dashboard"),
      },
      {
        id: "open-customize-dialog",
        label: "Customize dashboard widgets",
        group: "Dashboard",
        shortcut: "C",
        onSelect: () => setCustomizeOpen(true),
      },
      {
        id: "toggle-timeline",
        label: showTimeline ? "Hide timeline panel" : "Show timeline panel",
        group: "Dashboard",
        onSelect: () => setShowTimeline(!showTimeline),
      },
      {
        id: "toggle-actions",
        label: showQuickActions
          ? "Hide action board"
          : "Show action board",
        group: "Dashboard",
        onSelect: () => setShowQuickActions(!showQuickActions),
      },
      {
        id: "reset-dashboard",
        label: "Reset dashboard preferences",
        group: "Danger Zone",
        onSelect: () => resetDashboardPreferences(),
      },
      {
        id: "goto-customers",
        label: "Go to customers module",
        group: "Navigation",
        onSelect: () => router.push("/customers"),
      },
    ],
    [
      resetDashboardPreferences,
      router,
      setShowQuickActions,
      setShowTimeline,
      showQuickActions,
      showTimeline,
    ],
  );

  return (
    <div className={compactDensity ? "h-full overflow-y-auto p-4" : "h-full overflow-y-auto p-6"}>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <DashboardPageHeader
          badge={`${data.badge} · Configurable`}
          title={data.title}
          description="Widgets, metrics, and dashboard behavior are configurable and persisted locally by default."
          primaryAction={data.primaryAction}
          secondaryAction={data.secondaryAction}
        />

        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          timeframeValue={timeframe}
          timeframeOptions={TIMEFRAME_OPTIONS}
          onTimeframeChange={(value) =>
            setTimeframe(value as DashboardTimeframeKey)
          }
        >
          <SegmentSwitch
            value={activeSegment}
            options={SEGMENT_OPTIONS}
            onChange={(value) => setActiveSegment(value as DashboardSegmentKey)}
          />
          <Button variant="outline" onClick={() => setCustomizeOpen(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            Customize
          </Button>
          <Button variant="ghost" onClick={() => setCommandOpen(true)}>
            Command (⌘K)
          </Button>
        </FilterBar>

        {mergedMetrics.length > 0 ? (
          <DashboardMetricGrid metrics={mergedMetrics} />
        ) : (
          <EmptyState
            title="No metrics are currently visible"
            description="Enable at least one metric in dashboard preferences or add a custom metric to continue."
            actionLabel="Open preferences"
            onAction={() => setCustomizeOpen(true)}
          />
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            {filteredRecords.length > 0 ? (
              <DashboardRecordsTable
                title={data.recordsTitle}
                records={filteredRecords}
              />
            ) : (
              <EmptyState
                title="No records match your filters"
                description="Try another search query or segment to see data again."
                actionLabel="Clear search"
                onAction={() => setSearchQuery("")}
              />
            )}
          </div>

          <div className="space-y-6">
            {showTimeline ? (
              <TimelinePanel
                title={data.timelineTitle}
                items={filteredTimeline}
                dense={compactDensity}
                actionLabel="View all"
                onAction={() => setSearchQuery("")}
              />
            ) : null}

            {showQuickActions ? (
              <DashboardActionBoard
                title={data.checklistTitle}
                checklist={data.checklist}
                actions={data.quickActions}
              />
            ) : null}

            {!showTimeline && !showQuickActions ? (
              <EmptyState
                title="Secondary panels are hidden"
                description="Enable timeline or action board in dashboard preferences."
                actionLabel="Open preferences"
                onAction={() => setCustomizeOpen(true)}
              />
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Customize Dashboard</DialogTitle>
          </DialogHeader>
          <DashboardPreferencesPanel compact />
        </DialogContent>
      </Dialog>

      <CommandPalette
        actions={paletteActions}
        open={commandOpen}
        onOpenChange={setCommandOpen}
      />
    </div>
  );
}
