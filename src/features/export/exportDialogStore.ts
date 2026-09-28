import { create } from "zustand";
import type { ExportFormat, ExportResult, ExportStage } from "@/services/tauri/export";

/** What the export dialog shows. Closed while the Save dialog is up or nothing runs. */
export type ExportDialogState =
  | { phase: "closed" }
  | { phase: "working"; format: ExportFormat; stage: ExportStage; name: string }
  | { phase: "done"; format: ExportFormat; result: ExportResult }
  | { phase: "error"; format: ExportFormat; message: string };

interface ExportDialogStore {
  state: ExportDialogState;
  set: (state: ExportDialogState) => void;
  close: () => void;
}

export const useExportDialog = create<ExportDialogStore>((set) => ({
  state: { phase: "closed" },
  set: (state) => set({ state }),
  close: () => set({ state: { phase: "closed" } }),
}));
