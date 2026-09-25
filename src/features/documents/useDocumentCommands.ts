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

  return { newDocument, openDocument, openPath };
}
