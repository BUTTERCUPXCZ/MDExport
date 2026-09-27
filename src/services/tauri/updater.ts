import { Channel, invoke } from "@tauri-apps/api/core";
import type { UpdateInfo, UpdateProgress } from "@/types/update";

/** Where users can download a release by hand (when an in-app install isn't possible). */
export const RELEASES_URL = "https://github.com/BUTTERCUPXCZ/MDExport/releases/latest";

/**
 * In-app updates. Rust checks the latest published GitHub release and installs
 * signed builds only; the frontend just asks and shows progress.
 */
export const updaterService = {
  /** Newer release, or `null` when this version is the latest. */
  check(): Promise<UpdateInfo | null> {
    return invoke("check_for_update");
  },

  /** Downloads and installs the update found by the last check, then restarts the app. */
  install(onProgress: (progress: UpdateProgress) => void): Promise<void> {
    const channel = new Channel<UpdateProgress>();
    channel.onmessage = onProgress;
    return invoke("install_update", { onProgress: channel });
  },
};
