import { useEffect } from "react";
import { isDirty, useDocumentsStore } from "@/features/documents/documentsStore";
import { showError } from "@/features/notices/noticeStore";
import { usePrefsStore } from "@/features/prefs/prefsStore";
import { useUiStore } from "@/features/ui/uiStore";
import { windowService } from "@/services/tauri/window";

/** Open documents with unsaved changes. */
export const unsavedDocuments = () =>
  Object.values(useDocumentsStore.getState().documents).filter(isDirty);

/** Saves every unsaved document; resolves true when all of them saved. */
export async function saveAll(): Promise<boolean> {
  const { save } = useDocumentsStore.getState();
  const results = await Promise.all(unsavedDocuments().map((doc) => save(doc.id)));
  return results.every((result) => result === "saved");
}

/**
 * Never lose edits when the window closes. With autosave on, pending edits
 * are saved and the window closes; otherwise (or if a save fails) the user
 * decides in the close dialog.
 */
export function useCloseGuard() {
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let active = true;

    windowService
      .onCloseRequested(async (event) => {
        if (unsavedDocuments().length === 0) return;
        event.preventDefault();
        if (usePrefsStore.getState().autosave) {
          if (await saveAll()) {
            await windowService.destroy();
            return;
          }
          showError("Some changes couldn't be saved. Fix them, or close without saving.");
        }
        useUiStore.getState().setCloseGuardOpen(true);
      })
      .then(
        (stop) => (active ? (unlisten = stop) : stop()),
        () => {}, // outside Tauri (tests, browser preview)
      );

    return () => {
      active = false;
      unlisten?.();
    };
  }, []);
}
