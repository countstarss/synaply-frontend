import React from "react";
import { RiSaveLine, RiDraftLine, RiArrowGoBackLine } from "react-icons/ri";

interface WorkflowEditorToolbarProps {
  workflowName: string;
  isDraft: boolean;
  isSaving: boolean;
  onSave: () => void;
  onSaveAsDraft: () => void;
  onGoBack: () => void;
  disabled?: boolean;
}

export default function WorkflowEditorToolbar({
  workflowName,
  isDraft,
  isSaving,
  onSave,
  onSaveAsDraft,
  onGoBack,
  disabled = false,
}: WorkflowEditorToolbarProps) {
  return (
    <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
      <div className="bg-app-content-bg rounded-lg shadow-lg dark:shadow-black/20 p-2 border border-app-border">
        <div className="flex items-center gap-2">
          {/* 工作流名称 */}
          <div className="px-3 py-1 text-sm font-medium text-app-text-primary">
            {workflowName || "未命名工作流"}
            {isDraft && (
              <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded">
                草稿
              </span>
            )}
          </div>

          {/* 分隔线 */}
          <div className="w-px h-6 bg-app-border"></div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1">
            <button
              onClick={onSaveAsDraft}
              disabled={isSaving || disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="存为草稿"
            >
              <RiDraftLine className="w-4 h-4" />
              存为草稿
            </button>

            <button
              onClick={onSave}
              disabled={isSaving || disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              title="保存工作流"
            >
              <RiSaveLine className="w-4 h-4" />
              {isSaving ? "保存中..." : "保存工作流"}
            </button>

            <button
              onClick={onGoBack}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-app-text-secondary hover:text-app-text-primary border border-app-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="返回列表"
            >
              <RiArrowGoBackLine className="w-4 h-4" />
              返回
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
