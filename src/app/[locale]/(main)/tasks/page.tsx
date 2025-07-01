"use client";

import React, { useState } from "react";
import { Plus, Filter, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import InfoBarTabs from "@/components/layout/infobar/InfoBarTabs";

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("my-task");
  const [tasks] = useState([
    {
      id: "1",
      title: "Task 1 - create new project",
      status: "todo",
      priority: "high",
      assignee: "You",
      category: "all",
    },
    {
      id: "2",
      title: "Task 2 - create new project",
      status: "in-progress",
      priority: "medium",
      assignee: "Team",
      category: "assigned",
    },
    {
      id: "3",
      title: "Task 3 - review documentation",
      status: "todo",
      priority: "low",
      assignee: "You",
      category: "todo",
    },
    {
      id: "4",
      title: "Task 4 - implement feature",
      status: "in-progress",
      priority: "high",
      assignee: "You",
      category: "in-progress",
    },
  ]);

  // 标签页配置
  const tabs = [
    { id: "all", label: "All" },
    { id: "assigned", label: "Assigned" },
    { id: "todo", label: "Todo" },
    { id: "in-progress", label: "In Progress" },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // 根据活动标签过滤任务
  const filteredTasks = tasks.filter((task) => task.category === activeTab);

  return (
    <div className="flex flex-col h-full">
      {/* 标签页 */}
      <div className="px-4 py-3 bg-app-bg border-b border-app-border">
        <InfoBarTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* 页面内容 */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* 页面头部操作栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" className="bg-content-bg text-gray-400">
              <Plus className="w-4 h-4 mr-2" />
              <p>New Task</p>
            </Button>
            <Button
              variant="outline"
              className="border-app-border text-gray-300 hover:text-white btn-app-hover"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-300 hover:text-white hover:bg-app-content-bg"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* 任务列表 */}
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 bg-app-content-bg rounded-lg border border-app-border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-400">
                    #{task.id}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium">{task.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        task.status === "todo"
                          ? "bg-gray-700 text-gray-300"
                          : task.status === "in-progress"
                          ? "bg-blue-900 text-blue-300"
                          : "bg-green-900 text-green-300"
                      }`}
                    >
                      {task.status}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        task.priority === "high"
                          ? "bg-red-900 text-red-300"
                          : task.priority === "medium"
                          ? "bg-yellow-900 text-yellow-300"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-400">{task.assignee}</div>
            </div>
          ))}
        </div>

        {/* 空状态提示 */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400">
              <p className="text-lg font-medium">No tasks in this category</p>
              <p className="mt-2">Switch to another tab or create a new task</p>
            </div>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Task
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
