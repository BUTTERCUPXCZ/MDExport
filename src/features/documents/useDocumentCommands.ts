import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { showError } from "@/features/notices/noticeStore";
import { documentService } from "@/services/tauri/documents";
import { toAppError, type DocumentFile } from "@/types/document";

/** New / Open, shared by the Home page and global shortcuts. */
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

  const newDocument = useCallback(async () => {
    try {
      openInEditor(await documentService.create());
    } catch (e) {
      showError(`Couldn't create a document: ${toAppError(e).message}`);
    }
  }, [openInEditor]);

  const openDocument = useCallback(async () => {
    try {
      const file = await documentService.openDialog();
      if (file) openInEditor(file);
    } catch (e) {
      showError(`Couldn't open the file: ${toAppError(e).message}`);
    }
  }, [openInEditor]);

  return { newDocument, openDocument };
}
