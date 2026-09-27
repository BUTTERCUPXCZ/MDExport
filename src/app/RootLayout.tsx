import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { TitleBar } from "@/components/layout/TitleBar";
import { LibrarySetupDialog } from "@/features/library/LibrarySetupDialog";
import { refreshLibrary } from "@/features/library/libraryStore";
import { useLibraryLocation } from "@/features/library/useLibraryLocation";
import { QuickSwitcher } from "@/features/quick-switcher/QuickSwitcher";
import { CloseGuardDialog } from "@/features/session/CloseGuardDialog";
import { useAutosave } from "@/features/session/useAutosave";
import { useCloseGuard } from "@/features/session/useCloseGuard";
import { useSessionRestore } from "@/features/session/useSessionRestore";
import { ShortcutsDialog } from "@/features/shortcuts/ShortcutsDialog";
import { UpdateDialog } from "@/features/updates/UpdateDialog";
import { useUpdateCheck } from "@/features/updates/useUpdateCheck";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

/** Focus rescans closer together than this are skipped (alt-tabbing back and forth). */
const FOCUS_RESCAN_MS = 3000;

/** Scans the library once it's known, and again whenever the window regains focus
 *  (picks up files added or renamed outside MDExport). */
function useLibrarySync() {
  const location = useLibraryLocation((s) => s.location);

  useEffect(() => {
    if (!location) return;
    void refreshLibrary();
    let last = Date.now();
    const onFocus = () => {
      if (Date.now() - last < FOCUS_RESCAN_MS) return;
      last = Date.now();
      void refreshLibrary();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [location]);
}

export function RootLayout() {
  useGlobalShortcuts();
  useLibrarySync();
  useAutosave();
  useCloseGuard();
  useSessionRestore();
  useUpdateCheck();
  return (
    <>
      <div className="flex h-screen flex-col">
        <TitleBar />
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
      </div>
      <LibrarySetupDialog />
      <QuickSwitcher />
      <ShortcutsDialog />
      <CloseGuardDialog />
      <UpdateDialog />
    </>
  );
}
