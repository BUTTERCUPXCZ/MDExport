import { create } from "zustand";

export interface Notice {
  kind: "error" | "info";
  message: string;
}

interface NoticeState {
  notice: Notice | null;
  show: (notice: Notice) => void;
  dismiss: () => void;
}

/** App-wide notice bar (Discord-style banner at the top of the main column). */
export const useNoticeStore = create<NoticeState>((set) => ({
  notice: null,
  show: (notice) => set({ notice }),
  dismiss: () => set({ notice: null }),
}));

export const showError = (message: string) =>
  useNoticeStore.getState().show({ kind: "error", message });
