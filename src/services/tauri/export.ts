import { invoke } from "@tauri-apps/api/core";

export type ExportFormat = "pdf" | "docx" | "html";

/** PDF page layout: A4 pages for printing, or one continuous page that is never cut. */
export type PdfPages = "a4" | "continuous";

/** Mirrors `commands::export::ExportResult` in Rust. */
export interface ExportResult {
  path: string;
  name: string;
}

export const exportService = {
  /**
   * Converts Markdown (the editor's current text, saved or not) to a file.
   * Shows a Save dialog; resolves `null` if cancelled.
   */
  export(
    content: string,
    format: ExportFormat,
    fileName: string,
    sourcePath?: string,
    pdfPages: PdfPages = "a4",
  ): Promise<ExportResult | null> {
    return invoke("export_document", {
      content,
      format,
      fileName,
      sourcePath: sourcePath ?? null,
      pdfPages,
    });
  },

  /** Opens a file exported this session with the system's default app. */
  openExported(path: string): Promise<void> {
    return invoke("open_exported", { path });
  },
};
