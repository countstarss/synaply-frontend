"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AiWorkbenchChatComposer } from "@/components/ai/workbench/modules/chat/AiWorkbenchChatComposer";
import { AiWorkbenchSelectionToolbar } from "@/components/ai/workbench/modules/chat/AiWorkbenchSelectionToolbar";
import { useAiWorkbenchSelectionStore } from "@/components/ai/workbench/modules/chat/AiWorkbenchSelectionStore";

interface AiWorkbenchInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => Promise<void> | void;
  disabled?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
}

export function AiWorkbenchInputArea({
  value,
  onChange,
  onSend,
  disabled = false,
  isSubmitting = false,
  error = null,
}: AiWorkbenchInputAreaProps) {
  const isSelectionMode = useAiWorkbenchSelectionStore(
    (state) => state.isSelectionMode,
  );

  return (
    <AnimatePresence mode="wait">
      {isSelectionMode ? (
        <motion.div
          key="selection-toolbar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <AiWorkbenchSelectionToolbar />
        </motion.div>
      ) : (
        <motion.div
          key="chat-composer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <AiWorkbenchChatComposer
            value={value}
            onChange={onChange}
            onSend={onSend}
            disabled={disabled}
            isSubmitting={isSubmitting}
            error={error}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
