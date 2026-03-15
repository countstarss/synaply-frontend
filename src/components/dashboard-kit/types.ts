export type TrendTone = "positive" | "neutral" | "warning";

export interface DashboardMetric {
  id?: string;
  label: string;
  value: string;
  trend: string;
  tone?: TrendTone;
  sparkline?: number[];
  segment?: string;
  formula?: string;
}

export interface DashboardRecord {
  id: string;
  name: string;
  status: string;
  owner: string;
  updatedAt: string;
}

export interface DashboardTimelineItem {
  id: string;
  title: string;
  detail: string;
  time: string;
}

export interface DashboardQuickAction {
  id: string;
  label: string;
  description: string;
  shortcut?: string;
}
