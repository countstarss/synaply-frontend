"use client";

import React, { useState } from "react";

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { resultText: string }) => void;
}

export function RecordModal({ isOpen, onClose, onSubmit }: RecordModalProps) {
  const [text, setText] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-app-content-bg rounded-lg w-full max-w-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">填写成果物</h2>
        <textarea
          className="w-full h-32 border border-app-border rounded p-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="本步骤完成情况..."
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 border border-app-border rounded"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={!text.trim()}
            onClick={() => onSubmit({ resultText: text.trim() })}
          >
            提交
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecordModal;
