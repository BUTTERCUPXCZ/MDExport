import { Channel, invoke } from "@tauri-apps/api/core";

export type ExportFormat = "pdf" | "docx" | "html";

/** PDF page layout: A4 pages for printing, or one continuous page that is never cut. */
export type PdfPages = "a4" | "continuous";

/** Mirrors `commands::export::ExportStage` in Rust: sent once a location is picked. */
export type ExportStage = "converting" | "saving";

/** Mirrors `commands::export::ExportResult` in Rust. */
export interface ExportResult {
  path: string;
  name: string;
  /** Folder the file was saved in. */
  folder: string;
}

export const exportService = {
  /**
   * Converts Markdown (the editor's current text, saved or not) to a file.
   * Shows a Save dialog; resolves `null` if cancelled. `onStage` reports progress
   * after the dialog closes.
   */
  export(
    content: string,
    format: ExportFormat,
    fileName: string,
    sourcePath?: string,
    pdfPages: PdfPages = "a4",
    onStage: (stage: ExportStage) => void = () => {},
  ): Promise<ExportResult | null> {
    const onProgress = new Channel<ExportStage>();
    onProgress.onmessage = onStage;
    return invoke("export_document", {
      content,
      format,
      fileName,
      sourcePath: sourcePath ?? null,
      pdfPages,
      onProgress,
    });
  },

  /** Opens a file exported this session with the system's default app. */
  openExported(path: string): Promise<void> {
    return invoke("open_exported", { path });
  },

  /** Shows a file exported this session in the system file manager. */
  revealExported(path: string): Promise<void> {
    return invoke("reveal_exported", { path });
  },
};
