import { useCallback } from "react";
import type { OpenDocument } from "@/features/documents/documentsStore";
import { showError, showSuccess } from "@/features/notices/noticeStore";
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
 * you see in the preview is what ends up in the file.
 */
export function useExport() {
  const setExporting = useUiStore((s) => s.setExporting);

  return useCallback(
    async (doc: OpenDocument, format: ExportFormat) => {
      if (useUiStore.getState().exporting) return;
      setExporting(format);
      try {
        const result = await exportService.export(doc.content, format, doc.name, doc.path);
        if (result) {
          showSuccess(`Exported ${result.name}`, {
            label: "Open",
            run: () =>
              void exportService
                .openExported(result.path)
                .catch((e) => showError(toAppError(e).message)),
          });
        }
      } catch (e) {
        showError(`Export failed: ${toAppError(e).message}`);
      } finally {
        setExporting(null);
      }
    },
    [setExporting],
  );
}
