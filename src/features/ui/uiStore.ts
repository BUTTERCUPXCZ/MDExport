import { create } from "zustand";
import type { ViewMode } from "@/features/editor/ViewModeToggle";
import type { ExportFormat } from "@/services/tauri/export";

const VIEW_MODES: ViewMode[] = ["editor", "split", "preview"];

interface UiState {
  quickSwitcherOpen: boolean;
  shortcutsOpen: boolean;
  createFolderOpen: boolean;
  /** Path of the document whose name is being edited in the sidebar, if any. */
  renamingPath: string | null;
  exportMenuOpen: boolean;
  /** Format currently being exported, if any. */
  exporting: ExportFormat | null;
  /** Editor layout, shared so the quick switcher and shortcuts can change it. */
  viewMode: ViewMode;
  setQuickSwitcherOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setCreateFolderOpen: (open: boolean) => void;
  setRenamingPath: (path: string | null) => void;
  setExportMenuOpen: (open: boolean) => void;
  setExporting: (format: ExportFormat | null) => void;
  setViewMode: (mode: ViewMode) => void;
  cycleViewMode: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  quickSwitcherOpen: false,
  shortcutsOpen: false,
  createFolderOpen: false,
  renamingPath: null,
  exportMenuOpen: false,
  exporting: null,
  viewMode: "split",
  setQuickSwitcherOpen: (quickSwitcherOpen) => set({ quickSwitcherOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setCreateFolderOpen: (createFolderOpen) => set({ createFolderOpen }),
  setRenamingPath: (renamingPath) => set({ renamingPath }),
  setExportMenuOpen: (exportMenuOpen) => set({ exportMenuOpen }),
  setExporting: (exporting) => set({ exporting }),
  setViewMode: (viewMode) => set({ viewMode }),
  cycleViewMode: () =>
    set((s) => ({
      viewMode: VIEW_MODES[(VIEW_MODES.indexOf(s.viewMode) + 1) % VIEW_MODES.length],
    })),
}));
