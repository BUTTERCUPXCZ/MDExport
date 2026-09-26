import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { useActiveDocumentInfo } from "@/features/documents/useActiveDocument";
import { refreshLibrary, useLibraryStore } from "@/features/library/libraryStore";
import { showError } from "@/features/notices/noticeStore";
import { documentService } from "@/services/tauri/documents";
import { libraryService } from "@/services/tauri/library";
import { toAppError } from "@/types/document";

/** Absolute path prefix of a library folder, for matching open documents inside it. */
export function folderPrefix(root: string, folder: string): string {
  const separator = root.includes("\\") && !root.includes("/") ? "\\" : "/";
  return `${root}${separator}${folder.split("/").join(separator)}${separator}`;
}

/**
 * Moves documents and folders from the library index to the system trash.
 * Open documents that go with them are closed; if the one on screen goes,
 * the app returns to the library home. Errors show in the notice bar.
 */
export function useLibraryTrash() {
  const navigate = useNavigate();
  const visible = useActiveDocumentInfo()?.id;

  /** Closes open documents matching `gone`; returns true if the visible one was among them. */
  const closeOpen = useCallback(
    (gone: (path: string) => boolean) => {
      const { documents, close } = useDocumentsStore.getState();
      let closedVisible = false;
      for (const doc of Object.values(documents)) {
        if (!gone(doc.path)) continue;
        if (doc.id === visible) closedVisible = true;
        close(doc.id);
      }
      return closedVisible;
    },
    [visible],
  );

  const trashDocument = useCallback(
    async (path: string) => {
      try {
        await documentService.delete(path);
      } catch (e) {
        showError(`Couldn't move to trash: ${toAppError(e).message}`);
        return;
      }
      if (closeOpen((p) => p === path)) void navigate({ to: "/" });
      void refreshLibrary();
    },
    [closeOpen, navigate],
  );

  const trashFolder = useCallback(
    async (folder: string) => {
      const root = useLibraryStore.getState().listing?.root;
      try {
        await libraryService.deleteFolder(folder);
      } catch (e) {
        showError(`Couldn't move the folder to trash: ${toAppError(e).message}`);
        return;
      }
      if (root) {
        const prefix = folderPrefix(root, folder);
        if (closeOpen((p) => p.startsWith(prefix))) void navigate({ to: "/" });
      }
      void refreshLibrary();
    },
    [closeOpen, navigate],
  );

  return { trashDocument, trashFolder };
}
