'use client';

import React from 'react';
import Link from 'next/link';
import { 
  RiFileTextLine,
  RiAddLine,
  RiArrowRightLine,
  RiUserLine,
  RiSettings4Line,
  RiBookmarkLine
} from 'react-icons/ri';

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

function FeatureCard({ title, description, icon, href, stats, primaryAction }: FeatureCardProps) {
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

      <h3 className="text-lg font-semibold text-app-text-primary mb-2">{title}</h3>
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

export default function Personal() {
  const features = [
    {
      title: "个人文档",
      description: "管理你的个人笔记、学习资料和私人文档。",
      icon: <RiFileTextLine className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
      href: "/personal/doc",
      stats: [
        { label: "个人文档", value: 4 },
        { label: "文档分类", value: 2 }
      ],
      primaryAction: {
        label: "新建文档",
        onClick: () => console.log("Create personal doc")
      }
    },
    {
      title: "个人任务",
      description: "追踪和管理个人待办事项和目标。",
      icon: <RiBookmarkLine className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      href: "/personal/tasks",
      stats: [
        { label: "待办任务", value: 12 },
        { label: "本周完成", value: 8 }
      ],
      primaryAction: {
        label: "新建任务",
        onClick: () => console.log("Create task")
      }
    },
    {
      title: "个人设置",
      description: "管理账户信息、偏好设置和安全选项。",
      icon: <RiSettings4Line className="w-6 h-6 text-gray-600 dark:text-gray-400" />,
      href: "/personal/settings",
      primaryAction: {
        label: "前往设置",
        onClick: () => console.log("Go to settings")
      }
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-app-bg">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <RiUserLine className="w-8 h-8 text-app-text-primary" />
            <h1 className="text-3xl font-bold text-app-text-primary">个人空间</h1>
          </div>
          <p className="text-app-text-secondary">管理你的个人文档、任务和设置</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
            <p className="text-sm text-app-text-secondary mb-1">个人文档</p>
            <p className="text-2xl font-semibold text-app-text-primary">4</p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
            <p className="text-sm text-app-text-secondary mb-1">待办任务</p>
            <p className="text-2xl font-semibold text-app-text-primary">12</p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
            <p className="text-sm text-app-text-secondary mb-1">本周完成</p>
            <p className="text-2xl font-semibold text-app-text-primary">8</p>
          </div>
          <div className="bg-app-content-bg rounded-lg border border-app-border p-4">
            <p className="text-sm text-app-text-secondary mb-1">完成率</p>
            <p className="text-2xl font-semibold text-app-text-primary">67%</p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
}