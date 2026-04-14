"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";

interface HistoryTabProps {
  activities: Array<{
    id: string;
    action: string;
    actorId: string;
    createdAt: string;
    actor?: {
      user?: {
        name?: string | null;
        email?: string | null;
      } | null;
    } | null;
  }>;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ activities }) => {
  const tIssues = useTranslations("issues");
  const locale = useLocale();

  return (
    <div className="h-full p-4 overflow-y-auto">
      <div className="space-y-3 overflow-y-auto">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-app-text-primary">{activity.action}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-app-text-muted">
                <span>
                  {activity.actor?.user?.name ||
                    activity.actor?.user?.email?.split("@")[0] ||
                    activity.actorId}
                </span>
                <span>•</span>
                <span>{new Date(activity.createdAt).toLocaleString(locale)}</span>
              </div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-center text-app-text-muted py-8">
            {tIssues("tabs.history.empty")}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;
