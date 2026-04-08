"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { resultText: string }) => void;
}

export function RecordModal({ isOpen, onClose, onSubmit }: RecordModalProps) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setText("");
    }
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-lg border-app-border bg-app-content-bg p-6"
        showCloseButton={false}
      >
        <DialogTitle className="text-lg text-app-text-primary">填写成果物</DialogTitle>
        <div className="space-y-4">
          <Textarea
            className="min-h-32 border-app-border bg-app-bg text-app-text-primary"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="本步骤完成情况..."
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-app-border bg-transparent text-app-text-primary"
              onClick={onClose}
            >
              取消
            </Button>
            <Button
              type="button"
              className="bg-sky-600 text-white hover:bg-sky-500"
              disabled={!text.trim()}
              onClick={() => onSubmit({ resultText: text.trim() })}
            >
              提交
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default RecordModal;
