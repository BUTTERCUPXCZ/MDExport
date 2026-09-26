import { create } from "zustand";
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
  createFolderOpen: boolean;
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
  setCreateFolderOpen: (open: boolean) => void;
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
  createFolderOpen: false,
  renamingPath: null,
  exporting: null,
  stage: "proof",
  exportFormat: "pdf",
  setQuickSwitcherOpen: (quickSwitcherOpen) => set({ quickSwitcherOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setCreateFolderOpen: (createFolderOpen) => set({ createFolderOpen }),
  setRenamingPath: (renamingPath) => set({ renamingPath }),
  setExporting: (exporting) => set({ exporting }),
  setStage: (stage) => set({ stage }),
  toggleWriteProof: () => set((s) => ({ stage: s.stage === "proof" ? "write" : "proof" })),
  setExportFormat: (exportFormat) => set({ exportFormat }),
}));
