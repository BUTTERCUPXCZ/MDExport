import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { CreateFolderDialog } from "@/features/library/CreateFolderDialog";
import { LibrarySetupDialog } from "@/features/library/LibrarySetupDialog";
import { refreshLibrary } from "@/features/library/libraryStore";
import { useLibraryLocation } from "@/features/library/useLibraryLocation";
import { QuickSwitcher } from "@/features/quick-switcher/QuickSwitcher";
import { ShortcutsDialog } from "@/features/shortcuts/ShortcutsDialog";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

/** Scans the library once it's known, and again whenever the window regains focus
 *  (picks up files added or renamed outside MDForge). */
function useLibrarySync() {
  const location = useLibraryLocation((s) => s.location);

  useEffect(() => {
    if (!location) return;
    void refreshLibrary();
    const onFocus = () => void refreshLibrary();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [location]);
}

export function RootLayout() {
  useGlobalShortcuts();
  useLibrarySync();
  return (
    <>
      <Outlet />
      <LibrarySetupDialog />
      <QuickSwitcher />
      <ShortcutsDialog />
      <CreateFolderDialog />
    </>
  );
}
