"use client";

import { useMemo, useState } from "react";
import {
  DashboardActionBoard,
  DashboardMetricGrid,
  DashboardPageHeader,
  EmptyState,
  FilterBar,
  TimelinePanel,
} from "@/components/dashboard-kit";
import {
  ADMIN_MODULE_DATA,
  AdminModuleId,
} from "@/lib/data/admin-data";
import { useDashboardPreferencesStore } from "@/stores/dashboard-preferences";
import { AdminFieldCoverage } from "./AdminFieldCoverage";
import { AdminRecordsTable } from "./AdminRecordsTable";
import { AdminStatusBoard } from "./AdminStatusBoard";

const TIMEFRAME_OPTIONS = [
  { value: "today", label: "今天" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
];

interface AdminModulePageProps {
  module: AdminModuleId;
}

export function AdminModulePage({ module }: AdminModulePageProps) {
  const data = ADMIN_MODULE_DATA[module];
  const compactDensity = useDashboardPreferencesStore(
    (state) => state.compactDensity,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [timeframe, setTimeframe] = useState("7d");

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) {
      return data.rows;
    }

    const query = searchQuery.toLowerCase();

    return data.rows.filter((row) =>
      Object.values(row).some((value) =>
        value.toLowerCase().includes(query),
      ),
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

  return (
    <div
      className={compactDensity ? "h-full overflow-y-auto p-4" : "h-full overflow-y-auto p-6"}
    >
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <DashboardPageHeader
          badge={data.badge}
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
          onTimeframeChange={setTimeframe}
        />

        <DashboardMetricGrid metrics={data.metrics} />

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
                title="没有匹配结果"
                description="可以尝试切换搜索关键词，查看其他老师、订单或日志记录。"
                actionLabel="清空搜索"
                onAction={() => setSearchQuery("")}
              />
            )}
          </div>

          <div className="space-y-6">
            {filteredTimeline.length > 0 ? (
              <TimelinePanel title={data.timelineTitle} items={filteredTimeline} />
            ) : (
              <EmptyState
                title="时间线为空"
                description="当前搜索条件下没有匹配到动态记录。"
                actionLabel="清空搜索"
                onAction={() => setSearchQuery("")}
              />
            )}
            <DashboardActionBoard
              title={data.checklistTitle}
              checklist={data.checklist}
              actions={data.quickActions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
