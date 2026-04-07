"use client";

import React from "react";
import { RiAddLine, RiFolder2Line } from "react-icons/ri";

interface ProjectsEmptyStateProps {
  canManageProjects: boolean;
  onCreate: () => void;
}

export function ProjectsEmptyState({
  canManageProjects,
  onCreate,
}: ProjectsEmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-3xl border border-app-border bg-app-bg text-app-text-primary">
          <RiFolder2Line className="size-7" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-app-text-primary">
          还没有项目
        </h2>
        <p className="mt-2 text-sm leading-6 text-app-text-secondary">
          Project 模块已经接入真实后端接口。你可以先建立项目容器，再把相关任务归到项目里。
        </p>
        {canManageProjects ? (
          <button
            onClick={onCreate}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500"
          >
            <RiAddLine className="size-4" />
            创建第一个项目
          </button>
        ) : (
          <div className="mt-5 rounded-2xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text-secondary">
            当前团队空间只有 OWNER / ADMIN 可以创建、编辑或删除项目。
          </div>
        )}
      </div>
    </div>
  );
}
