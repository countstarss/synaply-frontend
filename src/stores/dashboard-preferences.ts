"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DashboardMetric, TrendTone } from "@/components/dashboard-kit";
import {
  ADMIN_DASHBOARD_DATA,
  DashboardLandingModule,
} from "@/lib/data/admin-data";

export type DashboardSegmentKey = "overview" | "revenue" | "operations";
export type DashboardTimeframeKey = "7d" | "30d" | "90d" | "12m";

export interface CustomMetricInput {
  label: string;
  value: string;
  trend: string;
  tone: TrendTone;
  formula?: string;
}

interface DashboardPreferencesState {
  visibleMetricIds: string[];
  customMetrics: DashboardMetric[];
  activeSegment: DashboardSegmentKey;
  timeframe: DashboardTimeframeKey;
  landingModule: DashboardLandingModule;
  showTimeline: boolean;
  showQuickActions: boolean;
  compactDensity: boolean;
  toggleMetric: (metricId: string) => void;
  setMetricVisibility: (metricId: string, visible: boolean) => void;
  addCustomMetric: (input: CustomMetricInput) => void;
  removeCustomMetric: (metricId: string) => void;
  setActiveSegment: (segment: DashboardSegmentKey) => void;
  setTimeframe: (timeframe: DashboardTimeframeKey) => void;
  setLandingModule: (module: DashboardLandingModule) => void;
  setShowTimeline: (enabled: boolean) => void;
  setShowQuickActions: (enabled: boolean) => void;
  setCompactDensity: (enabled: boolean) => void;
  resetDashboardPreferences: () => void;
}

const getMetricId = (metric: DashboardMetric) =>
  metric.id || metric.label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const DASHBOARD_BASE_METRICS = ADMIN_DASHBOARD_DATA.metrics.map((metric) => ({
  ...metric,
  id: getMetricId(metric),
}));

export const DASHBOARD_BASE_METRIC_IDS = DASHBOARD_BASE_METRICS.map((metric) =>
  getMetricId(metric),
);

const DEFAULT_STATE = {
  visibleMetricIds: DASHBOARD_BASE_METRIC_IDS,
  customMetrics: [],
  activeSegment: "overview" as DashboardSegmentKey,
  timeframe: "30d" as DashboardTimeframeKey,
  landingModule: "dashboard" as DashboardLandingModule,
  showTimeline: true,
  showQuickActions: true,
  compactDensity: false,
};

export const useDashboardPreferencesStore = create<DashboardPreferencesState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      toggleMetric: (metricId) => {
        const visible = get().visibleMetricIds.includes(metricId);
        get().setMetricVisibility(metricId, !visible);
      },
      setMetricVisibility: (metricId, visible) => {
        set((state) => {
          const current = new Set(state.visibleMetricIds);

          if (visible) {
            current.add(metricId);
          } else {
            current.delete(metricId);
          }

          return {
            visibleMetricIds: Array.from(current),
          };
        });
      },
      addCustomMetric: (input) => {
        const id = `custom-${Date.now()}`;

        set((state) => ({
          customMetrics: [
            ...state.customMetrics,
            {
              id,
              label: input.label,
              value: input.value,
              trend: input.trend,
              tone: input.tone,
              formula: input.formula,
              segment: state.activeSegment,
            },
          ],
          visibleMetricIds: [...state.visibleMetricIds, id],
        }));
      },
      removeCustomMetric: (metricId) => {
        set((state) => ({
          customMetrics: state.customMetrics.filter(
            (metric) => getMetricId(metric) !== metricId,
          ),
          visibleMetricIds: state.visibleMetricIds.filter((id) => id !== metricId),
        }));
      },
      setActiveSegment: (segment) => set({ activeSegment: segment }),
      setTimeframe: (timeframe) => set({ timeframe }),
      setLandingModule: (landingModule) => set({ landingModule }),
      setShowTimeline: (showTimeline) => set({ showTimeline }),
      setShowQuickActions: (showQuickActions) => set({ showQuickActions }),
      setCompactDensity: (compactDensity) => set({ compactDensity }),
      resetDashboardPreferences: () => set(DEFAULT_STATE),
    }),
    {
      name: "dashboard-preferences-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        visibleMetricIds: state.visibleMetricIds,
        customMetrics: state.customMetrics,
        activeSegment: state.activeSegment,
        timeframe: state.timeframe,
        landingModule: state.landingModule,
        showTimeline: state.showTimeline,
        showQuickActions: state.showQuickActions,
        compactDensity: state.compactDensity,
      }),
    },
  ),
);

export const getDashboardMetricId = getMetricId;
