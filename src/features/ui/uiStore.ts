import { create } from "zustand";
import type { ViewMode } from "@/features/editor/ViewModeToggle";

const VIEW_MODES: ViewMode[] = ["editor", "split", "preview"];

interface UiState {
  quickSwitcherOpen: boolean;
  shortcutsOpen: boolean;
  createFolderOpen: boolean;
  /** Editor layout, shared so the quick switcher and shortcuts can change it. */
  viewMode: ViewMode;
  setQuickSwitcherOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setCreateFolderOpen: (open: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  cycleViewMode: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  quickSwitcherOpen: false,
  shortcutsOpen: false,
  createFolderOpen: false,
  viewMode: "split",
  setQuickSwitcherOpen: (quickSwitcherOpen) => set({ quickSwitcherOpen }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setCreateFolderOpen: (createFolderOpen) => set({ createFolderOpen }),
  setViewMode: (viewMode) => set({ viewMode }),
  cycleViewMode: () =>
    set((s) => ({
      viewMode: VIEW_MODES[(VIEW_MODES.indexOf(s.viewMode) + 1) % VIEW_MODES.length],
    })),
}));
