"use client";

import React, { useState } from "react";
import { RiFolder3Line, RiEditLine, RiSaveLine } from "react-icons/ri";
import { useDocs, DocsDocument } from "./DocsContext";

interface FolderIntroProps {
  folder: DocsDocument;
}

export default function FolderIntro({ folder }: FolderIntroProps) {
  const { updateFolderDescription } = useDocs();
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(folder.description || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveDescription = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await updateFolderDescription(folder._id, description);
      setIsEditingDescription(false);
    } catch (error) {
      console.error("保存文件夹描述失败:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDescription(folder.description || "");
    setIsEditingDescription(false);
  };

  // 只有文件夹类型才显示此组件
  if (folder.type !== "folder") {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-app-bg">
      {/* Header */}
      <div className="px-8 py-6 border-b border-app-border bg-app-content-bg">
        <div className="flex items-center gap-3 mb-4">
          <RiFolder3Line className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-app-text-primary">
            {folder.title}
          </h1>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-app-text-secondary">
            文件夹 • 创建于{" "}
            {new Date(folder.createdAt).toLocaleDateString("zh-CN")}
          </div>

          {!isEditingDescription && (
            <button
              onClick={() => setIsEditingDescription(true)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-md transition-colors"
              disabled={!folder.canEdit}
            >
              <RiEditLine className="w-3 h-3" />
              编辑描述
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-4xl">
          <h2 className="text-xl font-semibold text-app-text-primary mb-4">
            文件夹描述
          </h2>

          {isEditingDescription ? (
            <div className="space-y-4">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="输入文件夹描述..."
                className="w-full h-32 px-4 py-3 border border-app-border rounded-lg bg-app-content-bg text-app-text-primary placeholder-app-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                autoFocus
                disabled={isSaving}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveDescription}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  <RiSaveLine className="w-4 h-4" />
                  {isSaving ? "保存中..." : "保存"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 text-app-text-secondary hover:text-app-text-primary disabled:text-app-text-muted border border-app-border rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div
              className="min-h-[200px] p-4 bg-app-content-bg border border-app-border rounded-lg text-app-text-primary whitespace-pre-wrap cursor-pointer"
              onClick={() => {
                if (!description && folder.canEdit) {
                  setIsEditingDescription(true);
                }
              }}
            >
              {description || (
                <span className="text-app-text-muted italic">
                  {folder.canEdit ? "点击添加文件夹描述..." : "暂无文件夹描述"}
                </span>
              )}
            </div>
          )}

          {/* Tips */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-2">
              💡 使用提示
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• 这是一个文件夹，用于组织和分类文档</li>
              <li>• 右键点击文件夹可以创建子文档或子文件夹</li>
              <li>• 可以在这里添加文件夹的详细说明和使用规范</li>
              <li>
                • 文件夹权限：
                {folder.visibility === "PRIVATE"
                  ? "私有"
                  : folder.visibility === "TEAM_READONLY"
                  ? "团队只读"
                  : folder.visibility === "TEAM_EDITABLE"
                  ? "团队可编辑"
                  : "公开"}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
