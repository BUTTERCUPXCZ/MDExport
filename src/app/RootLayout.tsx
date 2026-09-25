import { Outlet } from "@tanstack/react-router";
import { LibrarySetupDialog } from "@/features/library/LibrarySetupDialog";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

export function RootLayout() {
  useGlobalShortcuts();
  return (
    <>
      <Outlet />
      <LibrarySetupDialog />
    </>
  );
}
