import { create } from "zustand";

export interface Notice {
  kind: "error" | "info" | "success";
  message: string;
  /** Optional button, e.g. "Open" after an export. */
  action?: { label: string; run: () => void };
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

export const showError = (message: string, action?: Notice["action"]) =>
  useNoticeStore.getState().show({ kind: "error", message, action });

export const showInfo = (message: string, action?: Notice["action"]) =>
  useNoticeStore.getState().show({ kind: "info", message, action });

export const showSuccess = (message: string, action?: Notice["action"]) =>
  useNoticeStore.getState().show({ kind: "success", message, action });
