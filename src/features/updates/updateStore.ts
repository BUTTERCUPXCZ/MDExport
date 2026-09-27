import { create } from "zustand";
import { showError, showSuccess } from "@/features/notices/noticeStore";
import { usePrefsStore } from "@/features/prefs/prefsStore";
import { saveAll } from "@/features/session/useCloseGuard";
import { openerService } from "@/services/tauri/opener";
import { RELEASES_URL, updaterService } from "@/services/tauri/updater";
import { toAppError } from "@/types/document";
import type { UpdateInfo } from "@/types/update";

type UpdateStatus = "idle" | "checking" | "upToDate" | "available" | "installing" | "error";

interface UpdateState {
  status: UpdateStatus;
  /** The newer release, while one is available or installing. */
  info: UpdateInfo | null;
  /** Download progress from 0 to 1, or `null` when the size is unknown. */
  progress: number | null;
  /** Last error, shown in Settings. */
  error: string | null;
  /** The "new version available" dialog. */
  dialogOpen: boolean;
  /** Versions already shown in the dialog this session. */
  announced: string[];
  /**
   * Looks for a newer release. `quiet` checks (automatic ones) show the dialog once
   * per version per session and never for a skipped version; manual checks always report.
   */
  check: (options?: { quiet?: boolean }) => Promise<void>;
  /** Saves open documents, then downloads and installs the update and restarts. */
  install: () => Promise<void>;
  openDialog: () => void;
  closeDialog: () => void;
  /** "Skip this version": automatic checks stay quiet until a newer one is out. */
  skipVersion: () => void;
}

const downloadAction = {
  label: "Download",
  run: () => void openerService.openExternal(RELEASES_URL).catch(() => {}),
};

export const useUpdateStore = create<UpdateState>((set, get) => ({
  status: "idle",
  info: null,
  progress: null,
  error: null,
  dialogOpen: false,
  announced: [],

  async check({ quiet = false } = {}) {
    const { status } = get();
    if (status === "checking" || status === "installing") return;
    set({ status: "checking", error: null });
    try {
      const info = await updaterService.check();
      if (!info) {
        set({ status: "upToDate", info: null });
        if (!quiet) showSuccess("MDExport is up to date.");
        return;
      }
      const skipped = usePrefsStore.getState().skippedVersion === info.version;
      const seen = get().announced.includes(info.version);
      const announce = !quiet || (!seen && !skipped);
      set({
        status: "available",
        info,
        dialogOpen: announce || get().dialogOpen,
        announced: seen ? get().announced : [...get().announced, info.version],
      });
    } catch (e) {
      const message = toAppError(e).message;
      set({ status: quiet ? "idle" : "error", error: quiet ? null : message });
      if (!quiet) showError(message);
    }
  },

  async install() {
    if (get().status !== "available") return;
    // Never lose edits: the app restarts (or the installer closes it) right after.
    if (!(await saveAll())) {
      set({ dialogOpen: false });
      showError("Save or discard your unsaved changes before updating.");
      return;
    }
    set({ status: "installing", progress: 0, error: null });
    try {
      await updaterService.install(({ downloaded, total }) =>
        set({ progress: total ? Math.min(downloaded / total, 1) : null }),
      );
    } catch (e) {
      const message = toAppError(e).message;
      // Rust hands the update over when installing starts; a new check is needed to retry.
      set({ status: "error", progress: null, error: message, dialogOpen: false });
      showError(`${message} You can download it from GitHub instead.`, downloadAction);
    }
  },

  openDialog: () => set({ dialogOpen: true }),
  closeDialog: () => set({ dialogOpen: false }),
  skipVersion() {
    const version = get().info?.version;
    if (version) usePrefsStore.getState().setSkippedVersion(version);
    set({ dialogOpen: false });
  },
}));

export const checkForUpdates = (options?: { quiet?: boolean }) =>
  useUpdateStore.getState().check(options);
