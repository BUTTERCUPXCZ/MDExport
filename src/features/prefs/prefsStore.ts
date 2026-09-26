import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { Stage } from "@/features/ui/uiStore";

interface PrefsState {
  /** Save documents automatically shortly after typing stops. */
  autosave: boolean;
  /** Library document to reopen on launch, if any. */
  lastDocumentPath: string | null;
  /** Stage to reopen documents in. */
  lastStage: Stage;
  setAutosave: (autosave: boolean) => void;
  setLastDocumentPath: (path: string | null) => void;
  setLastStage: (stage: Stage) => void;
}

/** localStorage that never throws (private windows, blocked storage): prefs just don't persist. */
const safeStorage: StateStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* not persisted */
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/** Small per-device preferences, kept in the webview's local storage. */
export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      autosave: true,
      lastDocumentPath: null,
      lastStage: "proof",
      setAutosave: (autosave) => set({ autosave }),
      setLastDocumentPath: (lastDocumentPath) => set({ lastDocumentPath }),
      setLastStage: (lastStage) => set({ lastStage }),
    }),
    { name: "mdforge.prefs", version: 1, storage: createJSONStorage(() => safeStorage) },
  ),
);
