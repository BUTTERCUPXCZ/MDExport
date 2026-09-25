import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * App-wide keyboard shortcuts (Ctrl on Linux/Windows, Cmd on macOS).
 * - Ctrl+,        Settings
 * - Ctrl+S        Save          (reserved; wired up in Phase 4)
 * - Ctrl+Shift+S  Save As       (reserved; wired up in Phase 4)
 * - Ctrl+P        Quick Open    (reserved; never the webview's print dialog)
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();

      if (key === ",") {
        event.preventDefault();
        void navigate({ to: "/settings" });
      } else if (key === "s" || key === "p") {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);
}
