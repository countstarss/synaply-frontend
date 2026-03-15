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
  EmptyState,
  FilterBar,
  SegmentSwitch,
  TimelinePanel,
} from "@/components/dashboard-kit";
import { Settings2 } from "lucide-react";
import { DashboardPreferencesPanel } from "@/components/settings/DashboardPreferencesPanel";
import { ADMIN_DASHBOARD_DATA } from "@/lib/data/admin-data";
import {
  DashboardSegmentKey,
  DashboardTimeframeKey,
  getDashboardMetricId,
  useDashboardPreferencesStore,
} from "@/stores/dashboard-preferences";
import { AdminFieldCoverage } from "./AdminFieldCoverage";
import { AdminRecordsTable } from "./AdminRecordsTable";
import { AdminStatusBoard } from "./AdminStatusBoard";

const SEGMENT_OPTIONS = [
  { value: "overview", label: "总览" },
  { value: "revenue", label: "审核资料" },
  { value: "operations", label: "履约售后" },
];

const TIMEFRAME_OPTIONS = [
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
  { value: "90d", label: "近 90 天" },
  { value: "12m", label: "近 12 个月" },
];

const DASHBOARD_SEGMENT_MAP: Record<string, DashboardSegmentKey> = {
  "pending-teacher-review": "revenue",
  "household-completeness": "overview",
  "today-bookings": "operations",
  "ops-watchlist": "operations",
};

export function AdminDashboardPage() {
  const router = useRouter();
  const data = ADMIN_DASHBOARD_DATA;
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

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) {
      return data.rows;
    }

    const query = searchQuery.toLowerCase();

    return data.rows.filter((row) =>
      Object.values(row).some((value) => value.toLowerCase().includes(query)),
    );
  }, [data.rows, searchQuery]);

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
        label: "打开后台总览设置",
        group: "导航",
        shortcut: "S",
        onSelect: () => router.push("/settings/dashboard"),
      },
      {
        id: "open-customize-dialog",
        label: "自定义总览指标",
        group: "总览",
        shortcut: "C",
        onSelect: () => setCustomizeOpen(true),
      },
      {
        id: "goto-teachers",
        label: "跳到老师审核",
        group: "导航",
        shortcut: "T",
        onSelect: () => router.push("/teachers"),
      },
      {
        id: "goto-profiles",
        label: "跳到用户档案",
        group: "导航",
        onSelect: () => router.push("/profiles"),
      },
      {
        id: "goto-bookings",
        label: "跳到预约履约",
        group: "导航",
        shortcut: "B",
        onSelect: () => router.push("/bookings"),
      },
      {
        id: "goto-operations",
        label: "跳到评价运营",
        group: "导航",
        onSelect: () => router.push("/operations"),
      },
      {
        id: "goto-audit-logs",
        label: "跳到审计日志",
        group: "导航",
        onSelect: () => router.push("/audit-logs"),
      },
      {
        id: "toggle-timeline",
        label: showTimeline ? "隐藏时间线" : "显示时间线",
        group: "总览",
        onSelect: () => setShowTimeline(!showTimeline),
      },
      {
        id: "toggle-actions",
        label: showQuickActions ? "隐藏操作板" : "显示操作板",
        group: "总览",
        onSelect: () => setShowQuickActions(!showQuickActions),
      },
      {
        id: "reset-dashboard",
        label: "重置总览设置",
        group: "危险操作",
        onSelect: () => resetDashboardPreferences(),
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
    <div
      className={compactDensity ? "h-full overflow-y-auto p-4" : "h-full overflow-y-auto p-6"}
    >
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <DashboardPageHeader
          badge={`${data.badge} · MockData`}
          title={data.title}
          description={data.description}
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
            指标配置
          </Button>
          <Button variant="ghost" onClick={() => setCommandOpen(true)}>
            Command (⌘K)
          </Button>
        </FilterBar>

        {mergedMetrics.length > 0 ? (
          <DashboardMetricGrid metrics={mergedMetrics} />
        ) : (
          <EmptyState
            title="当前没有可见指标"
            description="至少打开一个总览指标，或者先新增一个自定义指标。"
            actionLabel="打开指标配置"
            onAction={() => setCustomizeOpen(true)}
          />
        )}

        <AdminStatusBoard
          title={data.statusTitle}
          description={data.statusDescription}
          items={data.statuses}
        />

        <AdminFieldCoverage
          title={data.fieldGroupsTitle}
          description={data.fieldGroupsDescription}
          groups={data.fieldGroups}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            {filteredRows.length > 0 ? (
              <AdminRecordsTable
                title={data.recordsTitle}
                description={data.recordsDescription}
                columns={data.columns}
                rows={filteredRows}
              />
            ) : (
              <EmptyState
                title="没有匹配到待处理项"
                description="可以切换搜索关键词，重新查看老师审核、订单或审计队列。"
                actionLabel="清空搜索"
                onAction={() => setSearchQuery("")}
              />
            )}
          </div>

          <div className="space-y-6">
            {showTimeline ? (
              filteredTimeline.length > 0 ? (
                <TimelinePanel title={data.timelineTitle} items={filteredTimeline} />
              ) : (
                <EmptyState
                  title="没有匹配到动态"
                  description="当前筛选条件下没有总览动态记录。"
                  actionLabel="清空搜索"
                  onAction={() => setSearchQuery("")}
                />
              )
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
                title="右侧信息面板已隐藏"
                description="可以在总览设置中重新打开时间线或操作板。"
                actionLabel="打开配置"
                onAction={() => setCustomizeOpen(true)}
              />
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>后台总览配置</DialogTitle>
          </DialogHeader>
          <DashboardPreferencesPanel compact />
        </DialogContent>
      </Dialog>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        actions={paletteActions}
      />
    </div>
  );
}
