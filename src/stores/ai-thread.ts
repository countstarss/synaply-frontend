import { create } from "zustand";
import type { AiMessageRecord } from "@/lib/ai/types";

interface AiThreadState {
  currentThreadId: string | null;
  messages: AiMessageRecord[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingText: string;
  error: string | null;
  setCurrentThreadId: (threadId: string | null) => void;
  setMessages: (messages: AiMessageRecord[]) => void;
  addMessage: (message: AiMessageRecord) => void;
  setLoading: (isLoading: boolean) => void;
  startStreaming: () => void;
  appendStreamingText: (chunk: string) => void;
  completeStreaming: () => void;
  cancelStreaming: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAiThreadStore = create<AiThreadState>((set, get) => ({
  currentThreadId: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingText: "",
  error: null,
  setCurrentThreadId: (threadId) => set({ currentThreadId: threadId }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setLoading: (isLoading) => set({ isLoading }),
  startStreaming: () =>
    set({
      isStreaming: true,
      streamingText: "",
    }),
  appendStreamingText: (chunk) =>
    set((state) => ({
      streamingText: `${state.streamingText}${chunk}`,
    })),
  completeStreaming: () => {
    const { currentThreadId, streamingText } = get();

    set((state) => ({
      messages:
        streamingText.trim() && currentThreadId
          ? [
              ...state.messages,
              {
                id: `local-assistant-${Date.now()}`,
                threadId: currentThreadId,
                runId: null,
                role: "ASSISTANT",
                parts: [
                  {
                    type: "text",
                    text: streamingText,
                  },
                ],
                createdAt: new Date().toISOString(),
              },
            ]
          : state.messages,
      isStreaming: false,
      streamingText: "",
    }));
  },
  cancelStreaming: () =>
    set({
      isStreaming: false,
      streamingText: "",
    }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      currentThreadId: null,
      messages: [],
      isLoading: false,
      isStreaming: false,
      streamingText: "",
      error: null,
    }),
}));
