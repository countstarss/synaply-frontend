"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  Bell,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { usePageCacheStore } from "@/stores/pageCache";

// 统计数据接口
interface DashboardStats {
  totalUsers: number;
  totalDocs: number;
  todayActivity: number;
  monthlyGrowth: string;
}

// 活动接口
interface Activity {
  id: string;
  type: "document" | "user" | "system";
  message: string;
  time: string;
  user: string;
}

// 模拟数据
const MOCK_STATS: DashboardStats = {
  totalUsers: 1247,
  totalDocs: 856,
  todayActivity: 23,
  monthlyGrowth: "+12.5%",
};

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "1",
    type: "document",
    message: "Created new document 'API Guidelines'",
    time: "2 minutes ago",
    user: "Sarah Wilson",
  },
  {
    id: "2",
    type: "user",
    message: "New user joined the workspace",
    time: "15 minutes ago",
    user: "John Doe",
  },
  {
    id: "3",
    type: "document",
    message: "Updated project requirements",
    time: "1 hour ago",
    user: "Team Lead",
  },
  {
    id: "4",
    type: "system",
    message: "System backup completed successfully",
    time: "2 hours ago",
    user: "System",
  },
];

const getActivityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "document":
      return <FileText className="w-4 h-4 text-blue-400" />;
    case "user":
      return <Users className="w-4 h-4 text-green-400" />;
    case "system":
      return <Activity className="w-4 h-4 text-orange-400" />;
    default:
      return <Bell className="w-4 h-4 text-gray-400" />;
  }
};

export const CachedDashboardPage = React.memo(() => {
  const { getPageState, updatePageData } = usePageCacheStore();
  const pageState = getPageState("dashboard");

  // 从缓存中获取状态，或使用默认值
  const [stats] = useState<DashboardStats>(
    (pageState?.data?.stats as DashboardStats) || MOCK_STATS
  );
  const [activities] = useState<Activity[]>(
    (pageState?.data?.activities as Activity[]) || MOCK_ACTIVITIES
  );
  const [lastUpdated, setLastUpdated] = useState(
    (pageState?.data?.lastUpdated as string) || new Date().toLocaleTimeString()
  );

  // 模拟实时更新
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString());
    }, 30000); // 每30秒更新一次

    return () => clearInterval(interval);
  }, []);

  // 更新缓存数据
  useEffect(() => {
    updatePageData("dashboard", {
      stats,
      activities,
      lastUpdated,
    });
  }, [stats, activities, lastUpdated, updatePageData]);

  return (
    <div className="p-6 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-400">Last updated: {lastUpdated}</p>
        </div>
        <div className="text-sm text-green-400">🟢 All systems operational</div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-app-content-bg border-app-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-xl font-semibold">
                {stats.totalUsers.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-app-content-bg border-app-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-900 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Documents</p>
              <p className="text-xl font-semibold">
                {stats.totalDocs.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-app-content-bg border-app-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-900 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Today&apos;s Activity</p>
              <p className="text-xl font-semibold">{stats.todayActivity}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-app-content-bg border-app-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Monthly Growth</p>
              <p className="text-xl font-semibold text-green-400">
                {stats.monthlyGrowth}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* 活动时间线 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-app-content-bg border-app-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </h2>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-app-bg rounded-full flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      by {activity.user}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-app-content-bg border-app-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button className="w-full p-3 text-left bg-app-bg rounded-lg hover:bg-opacity-80 transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Create New Document</span>
              </div>
            </button>
            <button className="w-full p-3 text-left bg-app-bg rounded-lg hover:bg-opacity-80 transition-colors">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-green-400" />
                <span>Invite Team Member</span>
              </div>
            </button>
            <button className="w-full p-3 text-left bg-app-bg rounded-lg hover:bg-opacity-80 transition-colors">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-orange-400" />
                <span>View Analytics</span>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
});

CachedDashboardPage.displayName = "CachedDashboardPage";
