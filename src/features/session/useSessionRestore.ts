import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { entryForPath } from "@/features/library/libraryModel";
import { useLibraryStore } from "@/features/library/libraryStore";
import { usePrefsStore } from "@/features/prefs/prefsStore";

/**
 * On launch, reopens the document that was on screen when the app last
 * closed — if it is still in the library. Runs once, only from the home page.
 */
export function useSessionRestore() {
  // Read before any page records a new value.
  const last = useRef(usePrefsStore.getState().lastDocumentPath);
  const listing = useLibraryStore((s) => s.listing);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { openPath } = useDocumentCommands();

  useEffect(() => {
    const path = last.current;
    if (!path || !listing) return;
    last.current = null; // once
    if (pathname === "/" && entryForPath(listing, path)) void openPath(path);
  }, [listing, openPath, pathname]);
}
