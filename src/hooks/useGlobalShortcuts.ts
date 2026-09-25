import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";

/**
 * App-wide keyboard shortcuts (Ctrl on Linux/Windows, Cmd on macOS).
 * - Ctrl+,        Settings
 * - Ctrl+N        New document
 * - Ctrl+O        Open file
 * - Ctrl+S        Save          (handled by the editor page; always kept from the webview)
 * - Ctrl+Shift+S  Save As       (handled by the editor page)
 * - Ctrl+P        Quick Open    (reserved; never the webview's print dialog)
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const { newDocument, openDocument } = useDocumentCommands();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();

      if (key === ",") {
        event.preventDefault();
        void navigate({ to: "/settings" });
      } else if (key === "n" && !event.shiftKey) {
        event.preventDefault();
        void newDocument();
      } else if (key === "o" && !event.shiftKey) {
        event.preventDefault();
        void openDocument();
      } else if (key === "s" || key === "p") {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, newDocument, openDocument]);
}
