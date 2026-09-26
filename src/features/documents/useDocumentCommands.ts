import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { refreshLibrary } from "@/features/library/libraryStore";
import { showError } from "@/features/notices/noticeStore";
import { documentService } from "@/services/tauri/documents";
import { toAppError, type DocumentFile } from "@/types/document";

/** New / Open / open-by-path, shared by pages, the sidebar, the quick switcher and shortcuts. */
export function useDocumentCommands() {
  const navigate = useNavigate();
  const add = useDocumentsStore((s) => s.add);

  const openInEditor = useCallback(
    (file: DocumentFile) => {
      const documentId = add(file);
      void navigate({ to: "/editor/$documentId", params: { documentId } });
    },
    [add, navigate],
  );

  /** Creates `Untitled.md` in `folder` (relative to the library; root if omitted). */
  const newDocument = useCallback(
    async (folder?: string) => {
      try {
        openInEditor(await documentService.create(folder));
        void refreshLibrary();
      } catch (e) {
        showError(`Couldn't create a document: ${toAppError(e).message}`);
      }
    },
    [openInEditor],
  );

  /**
   * Creates `name`.md in `folder` and opens it. Rejects with a user-facing
   * message, so the inline name field in the library can show it.
   */
  const createNamedDocument = useCallback(
    async (folder: string, name: string) => {
      try {
        openInEditor(await documentService.create(folder || undefined, name));
      } catch (e) {
        throw new Error(toAppError(e).message, { cause: e });
      }
      void refreshLibrary();
    },
    [openInEditor],
  );

  /** Shows the system Open dialog. */
  const openDocument = useCallback(async () => {
    try {
      const file = await documentService.openDialog();
      if (file) openInEditor(file);
    } catch (e) {
      showError(`Couldn't open the file: ${toAppError(e).message}`);
    }
  }, [openInEditor]);

  /** Opens a library file by path, reusing it if it's already open (keeps unsaved edits). */
  const openPath = useCallback(
    async (path: string) => {
      const existing = Object.values(useDocumentsStore.getState().documents).find(
        (d) => d.path === path,
      );
      if (existing) {
        void navigate({ to: "/editor/$documentId", params: { documentId: existing.id } });
        return;
      }
      try {
        openInEditor(await documentService.open(path));
      } catch (e) {
        showError(`Couldn't open the file: ${toAppError(e).message}`);
        void refreshLibrary();
      }
    },
    [navigate, openInEditor],
  );

  /**
   * Renames a document on disk and updates it everywhere (open editor, sidebar).
   * Rejects with a user-facing message so the rename field can show it inline.
   */
  const renameDocument = useCallback(async (path: string, newName: string) => {
    try {
      const renamed = await documentService.rename(path, newName);
      useDocumentsStore.getState().applyRename(path, renamed);
      await refreshLibrary();
    } catch (e) {
      throw new Error(toAppError(e).message, { cause: e });
    }
  }, []);

  return { newDocument, createNamedDocument, openDocument, openPath, renameDocument };
}
