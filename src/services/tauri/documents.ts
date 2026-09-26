import { invoke } from "@tauri-apps/api/core";
import type { DocumentFile, FileVersion, RenamedDocument } from "@/types/document";

/**
 * Document file operations. All dialogs run in Rust, and Rust only accepts
 * paths inside the library folder or chosen by the user in a dialog.
 * Errors reject with an `AppError` (see `@/types/document`).
 */
export const documentService = {
  /** Shows the Open dialog. Resolves `null` if cancelled. */
  openDialog(): Promise<DocumentFile | null> {
    return invoke("open_document_dialog");
  },

  /** Re-reads an already-open document from disk. */
  open(path: string): Promise<DocumentFile> {
    return invoke("open_document", { path });
  },

  /**
   * Creates an empty document in the library, optionally in a `/`-separated subfolder.
   * Named `name` (`.md` added) when given, otherwise the next free `Untitled N.md`.
   */
  create(folder?: string, name?: string): Promise<DocumentFile> {
    return invoke("create_document", { folder: folder || null, name: name ?? null });
  },

  /**
   * Saves content. Rejects with a `conflict` error if the file changed on disk
   * since `expectedHash`, unless `force` is set.
   */
  save(path: string, content: string, expectedHash: string, force = false): Promise<FileVersion> {
    return invoke("save_document", { path, content, expectedHash, force });
  },

  /** Shows the Save As dialog. Resolves `null` if cancelled. */
  saveAs(content: string, suggestedName: string): Promise<DocumentFile | null> {
    return invoke("save_document_as", { content, suggestedName });
  },

  /** Renames the file within its folder; `.md` is added if the name has no extension. */
  rename(path: string, newName: string): Promise<RenamedDocument> {
    return invoke("rename_document", { path, newName });
  },

  /** Moves the file to the OS trash. */
  delete(path: string): Promise<void> {
    return invoke("delete_document", { path });
  },
};
