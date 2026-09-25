import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

/** App-wide keyboard shortcuts. Ctrl+, (Cmd+, on macOS) opens Settings. */
export function useGlobalShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key === ",") {
        event.preventDefault();
        void navigate({ to: "/settings" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);
}
