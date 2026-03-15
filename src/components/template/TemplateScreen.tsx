"use client";

import {
  DashboardActionBoard,
  DashboardActivityFeed,
  DashboardMetricGrid,
  DashboardPageHeader,
  DashboardRecordsTable,
} from "@/components/dashboard-kit";
import {
  TEMPLATE_SCREEN_DATA,
  TemplateScreenKey,
} from "./template-data";

interface TemplateScreenProps {
  screen: TemplateScreenKey;
}

export default function TemplateScreen({ screen }: TemplateScreenProps) {
  const data = TEMPLATE_SCREEN_DATA[screen];

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <DashboardPageHeader
          badge={data.badge}
          title={data.title}
          description={data.description}
          primaryAction={data.primaryAction}
          secondaryAction={data.secondaryAction}
        />

        <DashboardMetricGrid metrics={data.metrics} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <DashboardRecordsTable title={data.recordsTitle} records={data.records} />
          </div>

          <div className="space-y-6">
            <DashboardActivityFeed title={data.timelineTitle} items={data.timeline} />
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
