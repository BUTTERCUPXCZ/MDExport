import { invoke } from "@tauri-apps/api/core";

export type ExportFormat = "pdf" | "docx" | "html";

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
  ): Promise<ExportResult | null> {
    return invoke("export_document", {
      content,
      format,
      fileName,
      sourcePath: sourcePath ?? null,
    });
  },

  /** Opens a file exported this session with the system's default app. */
  openExported(path: string): Promise<void> {
    return invoke("open_exported", { path });
  },
};
