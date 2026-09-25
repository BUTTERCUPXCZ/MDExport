import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { sidebarOrder } from "@/features/library/libraryModel";
import { useLibraryStore } from "@/features/library/libraryStore";
import { useActiveServer } from "@/features/library/useActiveServer";
import { useUiStore } from "@/features/ui/uiStore";

/**
 * App-wide keyboard shortcuts (Ctrl on Linux/Windows, Cmd on macOS).
 * The full list lives in `features/shortcuts/shortcuts.ts` (shown with Ctrl+/).
 * Ctrl+S / Ctrl+Shift+S are handled by the editor page; here they are only
 * kept from the webview's default handler, like Ctrl+P's print dialog.
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const { newDocument, openDocument, openPath } = useDocumentCommands();
  const { server, activePath } = useActiveServer();

  // Latest values for the long-lived listener.
  const latest = useRef({ server, activePath, openPath });
  useEffect(() => {
    latest.current = { server, activePath, openPath };
  });

  useEffect(() => {
    /** Ctrl+PageUp / PageDown: previous / next document in the sidebar. */
    const stepDocument = (delta: number) => {
      const listing = useLibraryStore.getState().listing;
      const { server, activePath, openPath } = latest.current;
      if (!listing) return;
      const order = sidebarOrder(listing, server);
      if (order.length === 0) return;
      const index = order.findIndex((d) => d.path === activePath);
      const next =
        index === -1
          ? order[delta > 0 ? 0 : order.length - 1]
          : order[(index + delta + order.length) % order.length];
      void openPath(next!.path);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const ui = useUiStore.getState();
      const key = event.key.toLowerCase();

      const handled = (() => {
        switch (key) {
          case "k":
          case "p":
            ui.setQuickSwitcherOpen(!ui.quickSwitcherOpen);
            return true;
          case "/":
            ui.setShortcutsOpen(!ui.shortcutsOpen);
            return true;
          case ",":
            void navigate({ to: "/settings" });
            return true;
          case "\\":
            ui.cycleViewMode();
            return true;
          case "pageup":
            stepDocument(-1);
            return true;
          case "pagedown":
            stepDocument(1);
            return true;
          case "n":
            if (event.shiftKey) return false;
            void newDocument();
            return true;
          case "o":
            if (event.shiftKey) return false;
            void openDocument();
            return true;
          case "s":
            return true;
          default:
            return false;
        }
      })();
      if (handled) event.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, newDocument, openDocument]);
}
