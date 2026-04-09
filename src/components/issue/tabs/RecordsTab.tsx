"use client";

import React from "react";

interface StepRecord {
  id: string;
  stepName: string;
  index: number;
  resultText?: string; // 改为可选
  createdAt: string;
  assignee?: {
    user?: {
      name?: string | null;
      email?: string | null;
    } | null;
  } | null;
}

interface RecordsTabProps {
  records: StepRecord[];
}

export const RecordsTab: React.FC<RecordsTabProps> = ({ records }) => {
  return (
    <div className="h-full p-4 overflow-y-auto">
      {records.map((rec) => (
        <div key={rec.id} className="border-b border-app-border py-2 text-sm">
          <div className="font-medium">
            {rec.stepName} (第{rec.index}步)
          </div>
          <div className="text-app-text-secondary mt-1 whitespace-pre-wrap">
            {rec.resultText}
          </div>
          <div className="text-xs text-app-text-muted mt-1">
            {(rec.assignee?.user?.name ||
              rec.assignee?.user?.email?.split("@")[0] ||
              "未知成员") +
              " · " +
              new Date(rec.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
      {records.length === 0 && (
        <div className="text-app-text-muted text-center py-8">暂无成果物</div>
      )}
    </div>
  );
};

export default RecordsTab;
