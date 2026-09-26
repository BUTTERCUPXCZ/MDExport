import { useEffect } from "react";
import { isDirty, useDocumentsStore } from "@/features/documents/documentsStore";
import { usePrefsStore } from "@/features/prefs/prefsStore";

/** Pause after the last keystroke before a document is saved automatically. */
export const AUTOSAVE_DELAY_MS = 1000;

/**
 * Saves each open document shortly after typing stops (when autosave is on).
 * Documents with an unresolved "changed on disk" conflict are left alone, so
 * the conflict dialog stays the one place that decides which version wins.
 */
export function useAutosave() {
  useEffect(() => {
    const timers = new Map<string, number>();

    const schedule = (id: string) => {
      window.clearTimeout(timers.get(id));
      timers.set(
        id,
        window.setTimeout(() => {
          timers.delete(id);
          const doc = useDocumentsStore.getState().documents[id];
          if (!doc || !isDirty(doc) || doc.conflict || !usePrefsStore.getState().autosave) return;
          // A save is running: try again once it has finished.
          if (doc.saveState === "saving") return schedule(id);
          void useDocumentsStore.getState().save(id);
        }, AUTOSAVE_DELAY_MS),
      );
    };

    const unsubscribe = useDocumentsStore.subscribe((state, prev) => {
      if (!usePrefsStore.getState().autosave) return;
      for (const doc of Object.values(state.documents)) {
        if (prev.documents[doc.id]?.content !== doc.content && isDirty(doc)) schedule(doc.id);
      }
    });

    return () => {
      unsubscribe();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);
}
