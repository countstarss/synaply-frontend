'use client';

import React, { useState } from 'react';
import { 
  RiAddLine,
  RiMoreLine,
  RiFlag2Line,
  RiTimeLine,
  RiTeamLine,
  RiCheckboxCircleLine,
  RiCircleLine,
  RiPlayCircleLine
} from 'react-icons/ri';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  progress: number;
  lead: string;
  team: string[];
  startDate: string;
  endDate: string;
  issuesCount: {
    total: number;
    completed: number;
  };
}

const statusConfig = {
  planning: {
    label: '规划中',
    color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
  },
  active: {
    label: '进行中',
    color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
  },
  completed: {
    label: '已完成',
    color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
  },
  on_hold: {
    label: '暂停',
    color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
  }
};

const mockProjects: Project[] = [
  {
    id: '1',
    name: '主站性能优化',
    description: '提升网站首页加载速度，优化用户体验',
    status: 'active',
    progress: 65,
    lead: '张三',
    team: ['张三', '李四', '王五'],
    startDate: '2024-01-01',
    endDate: '2024-02-15',
    issuesCount: { total: 23, completed: 15 }
  },
  {
    id: '2',
    name: '移动端重构',
    description: '使用 React Native 重构移动端应用',
    status: 'planning',
    progress: 15,
    lead: '李四',
    team: ['李四', '赵六'],
    startDate: '2024-02-01',
    endDate: '2024-04-30',
    issuesCount: { total: 45, completed: 7 }
  },
  {
    id: '3',
    name: '用户反馈系统',
    description: '构建完整的用户反馈收集和处理系统',
    status: 'completed',
    progress: 100,
    lead: '王五',
    team: ['王五', '周七'],
    startDate: '2023-11-01',
    endDate: '2024-01-10',
    issuesCount: { total: 32, completed: 32 }
  }
];

export default function Projects() {
  const [projects] = useState<Project[]>(mockProjects);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="h-full flex flex-col bg-app-bg">
      {/* Header */}
      <div className="border-b border-app-border px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-app-text-primary">Projects</h1>
            <div className="flex items-center gap-0.5 bg-app-button-hover rounded p-0.5">
              <button
                className={`px-2 py-0.5 text-sm rounded ${
                  viewMode === 'grid' 
                    ? 'bg-app-content-bg text-app-text-primary shadow-sm' 
                    : 'text-app-text-secondary hover:text-app-text-primary'
                }`}
                onClick={() => setViewMode('grid')}
              >
                网格
              </button>
              <button
                className={`px-2 py-0.5 text-sm rounded ${
                  viewMode === 'list' 
                    ? 'bg-app-content-bg text-app-text-primary shadow-sm' 
                    : 'text-app-text-secondary hover:text-app-text-primary'
                }`}
                onClick={() => setViewMode('list')}
              >
                列表
              </button>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
            <RiAddLine className="w-4 h-4" />
            新建项目
          </button>
        </div>
      </div>

      {/* Projects Grid/List */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const status = statusConfig[project.status];
              const progressPercentage = (project.issuesCount.completed / project.issuesCount.total) * 100;

              return (
                <div
                  key={project.id}
                  className="bg-app-content-bg rounded-xl border border-app-border p-6 hover:shadow-lg dark:hover:shadow-black/20 transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-app-text-primary">
                      {project.name}
                    </h3>
                    <button className="p-1 hover:bg-app-button-hover rounded">
                      <RiMoreLine className="w-5 h-5 text-app-text-secondary" />
                    </button>
                  </div>

                  <p className="text-sm text-app-text-secondary mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded ${status.color}`}>
                        {status.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <RiTeamLine className="w-4 h-4 text-app-text-muted" />
                        <span className="text-xs text-app-text-muted">{project.team.length}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-app-text-secondary">进度</span>
                        <span className="text-xs text-app-text-secondary">
                          {project.issuesCount.completed}/{project.issuesCount.total}
                        </span>
                      </div>
                      <div className="h-2 bg-app-button-hover rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 dark:bg-blue-500 transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-app-text-muted">
                      <RiTimeLine className="w-3.5 h-3.5" />
                      <span>{project.endDate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => {
              const status = statusConfig[project.status];
              const progressPercentage = (project.issuesCount.completed / project.issuesCount.total) * 100;

              return (
                <div
                  key={project.id}
                  className="bg-app-content-bg rounded-lg border border-app-border p-4 hover:shadow-md dark:hover:shadow-black/10 transition-shadow cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-medium text-app-text-primary">
                          {project.name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-app-text-secondary">
                        {project.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-app-text-primary">
                          {Math.round(progressPercentage)}%
                        </div>
                        <div className="text-xs text-app-text-muted">完成度</div>
                      </div>

                      <div className="flex -space-x-2">
                        {project.team.slice(0, 3).map((member, index) => (
                          <div 
                            key={index}
                            className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-app-content-bg flex items-center justify-center"
                          >
                            <span className="text-xs text-white">{member[0]}</span>
                          </div>
                        ))}
                        {project.team.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-app-button-hover border-2 border-app-content-bg flex items-center justify-center">
                            <span className="text-xs text-app-text-secondary">+{project.team.length - 3}</span>
                          </div>
                        )}
                      </div>

                      <button className="p-2 hover:bg-app-button-hover rounded">
                        <RiMoreLine className="w-5 h-5 text-app-text-secondary" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}