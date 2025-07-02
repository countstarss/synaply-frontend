"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RiTaskLine,
  RiFolderOpenLine,
  RiFlowChart,
  RiFileTextLine,
  RiAddLine,
  RiArrowRightLine,
} from "react-icons/ri";
import { workflowStorage, issueStorage } from "./utils/storage";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  stats?: {
    label: string;
    value: number;
  }[];
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

function FeatureCard({
  title,
  description,
  icon,
  href,
  stats,
  primaryAction,
}: FeatureCardProps) {
  return (
    <div className="bg-app-content-bg rounded-xl border border-app-border p-6 hover:shadow-lg dark:hover:shadow-black/20 transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-app-button-hover rounded-lg">{icon}</div>
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            <RiAddLine className="w-4 h-4" />
            {primaryAction.label}
          </button>
        )}
      </div>

      <h3 className="text-lg font-semibold text-app-text-primary mb-2">
        {title}
      </h3>
      <p className="text-sm text-app-text-secondary mb-4">{description}</p>

      {stats && (
        <div className="flex gap-4 mb-4">
          {stats.map((stat, index) => (
            <div key={index}>
              <p className="text-2xl font-semibold text-app-text-primary">
                {stat.value}
              </p>
              <p className="text-xs text-app-text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <Link
        href={href}
        className="inline-flex items-center gap-2 text-sm text-app-text-secondary hover:text-app-text-primary font-medium group"
      >
        查看全部
        <RiArrowRightLine className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

export default function Team() {
  const [stats, setStats] = useState({
    totalIssues: 0,
    inProgressIssues: 0,
    weeklyCompletedIssues: 0,
    totalWorkflows: 0,
    totalProjects: 8,
    activeProjects: 8,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const issues = issueStorage.getAll();
    const workflows = workflowStorage.getAll();

    const inProgressIssues = issues.filter(
      (issue) => issue.status === "in_progress"
    ).length;
    const weeklyCompleted = issues.filter((issue) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return issue.status === "done" && new Date(issue.updatedAt) > weekAgo;
    }).length;

    setStats({
      totalIssues: issues.length,
      inProgressIssues,
      weeklyCompletedIssues: weeklyCompleted,
      totalWorkflows: workflows.length,
      totalProjects: 8,
      activeProjects: 8,
    });
  };

  const teamName = "产品研发团队"; // 这里应该从context或props获取

  const features = [
    {
      title: "Issues",
      description:
        "追踪和管理团队的所有任务、Bug和需求。支持自定义工作流和状态。",
      icon: <RiTaskLine className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      href: "/team/issues",
      stats: [
        { label: "进行中", value: stats.inProgressIssues },
        { label: "本周完成", value: stats.weeklyCompletedIssues },
      ],
      primaryAction: {
        label: "新建 Issue",
        onClick: () => console.log("Create issue"),
      },
    },
    {
      title: "Projects",
      description: "组织和管理团队项目，追踪进度和里程碑。",
      icon: (
        <RiFolderOpenLine className="w-6 h-6 text-green-600 dark:text-green-400" />
      ),
      href: "/team/projects",
      stats: [
        { label: "活跃项目", value: stats.activeProjects },
        { label: "总项目数", value: stats.totalProjects },
      ],
      primaryAction: {
        label: "新建项目",
        onClick: () => console.log("Create project"),
      },
    },
    {
      title: "Workflows",
      description: "设计和管理团队工作流程模板，优化协作效率。",
      icon: (
        <RiFlowChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
      ),
      href: "/team/workflows",
      stats: [{ label: "工作流模板", value: stats.totalWorkflows }],
      primaryAction: {
        label: "创建工作流",
        onClick: () => console.log("Create workflow"),
      },
    },
    {
      title: "Docs",
      description: "团队知识库和文档管理，包含项目文档和团队规范。",
      icon: (
        <RiFileTextLine className="w-6 h-6 text-orange-600 dark:text-orange-400" />
      ),
      href: "/team/doc",
      stats: [
        { label: "团队文档", value: 42 },
        { label: "项目文档", value: 156 },
      ],
      primaryAction: {
        label: "新建文档",
        onClick: () => console.log("Create doc"),
      },
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-app-bg">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-app-text-primary mb-2">
            {teamName}
          </h1>
          <p className="text-app-text-secondary">
            管理团队的任务、项目、工作流和文档
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
            <p className="text-sm text-app-text-secondary mb-1">团队成员</p>
            <p className="text-2xl font-semibold text-app-text-primary">24</p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
            <p className="text-sm text-app-text-secondary mb-1">总 Issues</p>
            <p className="text-2xl font-semibold text-app-text-primary">
              {stats.totalIssues}
            </p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
            <p className="text-sm text-app-text-secondary mb-1">进行中的冲刺</p>
            <p className="text-2xl font-semibold text-app-text-primary">3</p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
            <p className="text-sm text-app-text-secondary mb-1">完成率</p>
            <p className="text-2xl font-semibold text-app-text-primary">87%</p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-app-text-primary mb-4">
            最近活动
          </h2>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 pb-4 border-b border-app-border last:border-0 last:pb-0"
                >
                  <div className="w-8 h-8 bg-app-button-hover rounded-full flex items-center justify-center text-sm font-medium text-app-text-secondary">
                    {i}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-app-text-primary">
                      <span className="font-medium">张三</span> 创建了新的
                      Issue：
                      <span className="text-blue-600 dark:text-blue-400">
                        {" "}
                        优化首页加载性能
                      </span>
                    </p>
                    <p className="text-xs text-app-text-muted mt-1">2 小时前</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
