import { useEffect } from "react";
import { usePrefsStore } from "@/features/prefs/prefsStore";
import { checkForUpdates } from "@/features/updates/updateStore";

/** Wait after launch before the first check, so startup stays quick. */
export const FIRST_CHECK_DELAY_MS = 10_000;
/** Checks again while the app stays open. */
export const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** Looks for a new release shortly after launch and every few hours (unless turned off in Settings). */
export function useUpdateCheck() {
  const enabled = usePrefsStore((s) => s.autoUpdateCheck);

  useEffect(() => {
    if (!enabled) return;
    const check = () => void checkForUpdates({ quiet: true });
    const first = window.setTimeout(check, FIRST_CHECK_DELAY_MS);
    const every = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, [enabled]);
}
