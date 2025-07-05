"use client";

import React, { useState } from "react";
import { RiFolder3Line, RiEditLine, RiSaveLine } from "react-icons/ri";
import { Doc } from "@/lib/db";
import { useDocs } from "./DocsContext";

interface FolderIntroProps {
  folder: Doc;
}

export default function FolderIntro({ folder }: FolderIntroProps) {
  const { updateFolderDescription } = useDocs();
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState(folder.description || "");

  const handleSaveDescription = async () => {
    await updateFolderDescription(folder.uid, description);
    setIsEditingDescription(false);
  };

  const handleCancelEdit = () => {
    setDescription(folder.description || "");
    setIsEditingDescription(false);
  };

  return (
    <div className="h-full flex flex-col bg-app-bg">
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
            文件夹 • 创建于 {new Date(folder.createdAt).toLocaleDateString()}
          </div>

          {!isEditingDescription && (
            <button
              onClick={() => setIsEditingDescription(true)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-md transition-colors"
            >
              <RiEditLine className="w-3 h-3" />
              编辑描述
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-6">
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
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveDescription}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <RiSaveLine className="w-4 h-4" />
                  保存
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div
              className="min-h-[200px] p-4 bg-app-content-bg border border-app-border rounded-lg text-app-text-primary whitespace-pre-wrap"
              onClick={() => !description && setIsEditingDescription(true)}
            >
              {description || (
                <span className="text-app-text-muted italic cursor-pointer">
                  点击添加文件夹描述...
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
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
