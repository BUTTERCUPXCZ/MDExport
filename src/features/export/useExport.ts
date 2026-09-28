import { useCallback } from "react";
import type { OpenDocument } from "@/features/documents/documentsStore";
import { useExportDialog } from "@/features/export/exportDialogStore";
import { stem } from "@/features/library/libraryModel";
import { usePrefsStore } from "@/features/prefs/prefsStore";
import { useUiStore } from "@/features/ui/uiStore";
import { exportService, type ExportFormat } from "@/services/tauri/export";
import { toAppError } from "@/types/document";

export const EXPORT_FORMATS: { format: ExportFormat; label: string; extension: string }[] = [
  { format: "pdf", label: "PDF document", extension: ".pdf" },
  { format: "docx", label: "Word document", extension: ".docx" },
  { format: "html", label: "HTML page", extension: ".html" },
];

/**
 * Exports the editor's current text — saved or not, typed or pasted — so what
 * you see in the preview is what ends up in the file. After the Save dialog, the
 * export dialog shows progress, then Open / Show in folder (or the error).
 */
export function useExport() {
  const setExporting = useUiStore((s) => s.setExporting);

  return useCallback(
    async (doc: OpenDocument, format: ExportFormat) => {
      if (useUiStore.getState().exporting) return;
      setExporting(format);
      const dialog = useExportDialog.getState();
      const name = `${stem(doc.name)}.${format}`;
      try {
        const result = await exportService.export(
          doc.content,
          format,
          doc.name,
          doc.path,
          usePrefsStore.getState().pdfPages,
          (stage) => dialog.set({ phase: "working", format, stage, name }),
        );
        // Cancelled in the Save dialog: nothing to show.
        dialog.set(result ? { phase: "done", format, result } : { phase: "closed" });
      } catch (e) {
        dialog.set({ phase: "error", format, message: toAppError(e).message });
      } finally {
        setExporting(null);
      }
    },
    [setExporting],
  );
}
