import { create } from "zustand";
import { usePrefsStore } from "@/features/prefs/prefsStore";
import type { ExportFormat } from "@/services/tauri/export";

/**
 * The three stages a document moves through:
 * write (editor only) → proof (editor beside the page) → deliver (page + export).
 */
export type Stage = "write" | "proof" | "deliver";

export const STAGES: { stage: Stage; label: string }[] = [
  { stage: "write", label: "Write" },
  { stage: "proof", label: "Proof" },
  { stage: "deliver", label: "Deliver" },
];

interface UiState {
  quickSwitcherOpen: boolean;
  shortcutsOpen: boolean;
  /** Inline "new document / new folder" name field in the library index, if open. */
  creating: { kind: "document" | "folder"; parent: string } | null;
  /** "You have unsaved changes" dialog shown when closing the window. */
  closeGuardOpen: boolean;
  /** Path of the document whose name is being edited in the library, if any. */
  renamingPath: string | null;
  /** Format currently being exported, if any. */
  exporting: ExportFormat | null;
  /** Current stage of the open document; shared so shortcuts and commands can change it. */
  stage: Stage;
  /** Format picked in the Deliver stage. */
  exportFormat: ExportFormat;
  setQuickSwitcherOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  /** Opens the inline name field in `parent` (relative; `""` = library root). */
  startCreating: (kind: "document" | "folder", parent?: string) => void;
  cancelCreating: () => void;
  setCloseGuardOpen: (open: boolean) => void;
  setRenamingPath: (path: string | null) => void;
  setExporting: (format: ExportFormat | null) => void;
  setStage: (stage: Stage) => void;
  /** Ctrl+\: flips between Write and Proof (from Deliver it returns to Proof). */
  toggleWriteProof: () => void;
  setExportFormat: (format: ExportFormat) => void;
}

export const useUiStore = create<UiState>((set) => ({
  quickSwitcherOpen: false,
  shortcutsOpen: false,
  creating: null,
  closeGuardOpen: false,
  renamingPath: null,
  exporting: null,
  // Documents reopen in the stage used last.
  stage: usePrefsStore.getState().lastStage,
  exportFormat: "pdf",
  setQuickSwitcherOpen: (quickSwitcherOpen) => set({ quickSwitcherOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setCloseGuardOpen: (closeGuardOpen) => set({ closeGuardOpen }),
  startCreating: (kind, parent = "") => set({ creating: { kind, parent }, renamingPath: null }),
  cancelCreating: () => set({ creating: null }),
  setRenamingPath: (renamingPath) => set({ renamingPath }),
  setExporting: (exporting) => set({ exporting }),
  setStage: (stage) => {
    set({ stage });
    usePrefsStore.getState().setLastStage(stage);
  },
  toggleWriteProof: () => {
    const stage = useUiStore.getState().stage === "proof" ? "write" : "proof";
    useUiStore.getState().setStage(stage);
  },
  setExportFormat: (exportFormat) => set({ exportFormat }),
}));
