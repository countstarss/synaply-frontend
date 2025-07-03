import { create } from 'zustand';

interface DocState {
  activeDocId: string | null;
  setActiveDocId: (docId: string | null) => void;
}

export const useDocStore = create<DocState>((set) => ({
  activeDocId: null,
  setActiveDocId: (docId) => set({ activeDocId: docId }),
}));
