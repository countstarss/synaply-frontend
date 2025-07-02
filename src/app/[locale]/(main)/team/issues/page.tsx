'use client';

import React, { useState } from 'react';
import { 
  RiAddLine, 
  RiSearchLine, 
  RiFilter3Line,
  RiCheckboxCircleLine,
  RiRadioButtonLine,
  RiPlayCircleLine,
  RiCloseCircleLine,
  RiArrowDownSLine
} from 'react-icons/ri';

interface Issue {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'canceled';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  assignee?: string;
  project?: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  todo: {
    label: '待处理',
    icon: <RiRadioButtonLine className="w-4 h-4" />,
    color: 'text-gray-500 dark:text-gray-400'
  },
  in_progress: {
    label: '进行中',
    icon: <RiPlayCircleLine className="w-4 h-4" />,
    color: 'text-blue-600 dark:text-blue-400'
  },
  done: {
    label: '已完成',
    icon: <RiCheckboxCircleLine className="w-4 h-4" />,
    color: 'text-green-600 dark:text-green-400'
  },
  canceled: {
    label: '已取消',
    icon: <RiCloseCircleLine className="w-4 h-4" />,
    color: 'text-gray-400 dark:text-gray-500'
  }
};

const priorityConfig = {
  urgent: { label: '紧急', color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' },
  high: { label: '高', color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
  medium: { label: '中', color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
  low: { label: '低', color: 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800' }
};

const mockIssues: Issue[] = [
  {
    id: '1',
    title: '优化首页加载性能',
    status: 'in_progress',
    priority: 'high',
    assignee: '张三',
    project: '主站优化',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-16'
  },
  {
    id: '2',
    title: '修复移动端样式错位问题',
    status: 'todo',
    priority: 'urgent',
    assignee: '李四',
    project: '移动端适配',
    createdAt: '2024-01-16',
    updatedAt: '2024-01-16'
  },
  {
    id: '3',
    title: '添加用户反馈功能',
    status: 'done',
    priority: 'medium',
    assignee: '王五',
    project: '用户体验',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15'
  }
];

export default function Issues() {
  const [selectedView, setSelectedView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [issues] = useState<Issue[]>(mockIssues);

  const filteredIssues = issues.filter(issue => 
    issue.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-app-bg">
      {/* Header */}
      <div className="border-b border-app-border px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-app-text-primary">Issues</h1>
            <div className="flex items-center gap-1 bg-app-button-hover rounded p-0.5">
              <button
                className={`px-2 py-0.5 text-sm rounded transition-colors ${
                  selectedView === 'all' 
                    ? 'bg-app-content-bg text-app-text-primary shadow-sm' 
                    : 'text-app-text-secondary hover:text-app-text-primary'
                }`}
                onClick={() => setSelectedView('all')}
              >
                全部
              </button>
              <button
                className={`px-2 py-0.5 text-sm rounded transition-colors ${
                  selectedView === 'my' 
                    ? 'bg-app-content-bg text-app-text-primary shadow-sm' 
                    : 'text-app-text-secondary hover:text-app-text-primary'
                }`}
                onClick={() => setSelectedView('my')}
              >
                我的
              </button>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
            <RiAddLine className="w-4 h-4" />
            新建 Issue
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-app-border px-6 py-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted" />
            <input
              type="text"
              placeholder="搜索 issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-app-button-hover border border-app-border rounded-md text-sm text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-md">
            <RiFilter3Line className="w-4 h-4" />
            筛选
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4">
          <div className="space-y-1">
            {filteredIssues.map((issue) => {
              const status = statusConfig[issue.status];
              const priority = priorityConfig[issue.priority];
              
              return (
                <div
                  key={issue.id}
                  className="group flex items-center gap-4 px-4 py-3 hover:bg-app-button-hover rounded-lg cursor-pointer transition-colors"
                >
                  <div className={`flex items-center ${status.color}`}>
                    {status.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-app-text-primary truncate">
                      {issue.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-app-text-muted">#{issue.id}</span>
                      {issue.project && (
                        <span className="text-xs text-app-text-secondary">{issue.project}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded border ${priority.color}`}>
                      {priority.label}
                    </span>
                    {issue.assignee && (
                      <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-xs text-white">{issue.assignee[0]}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}