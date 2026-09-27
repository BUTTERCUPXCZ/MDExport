import { create } from "zustand";
import { showError, showInfo, showSuccess } from "@/features/notices/noticeStore";
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
  /**
   * Looks for a newer release. `quiet` checks (automatic ones) only speak up when
   * there is an update, and only once per version; manual checks always report.
   */
  check: (options?: { quiet?: boolean }) => Promise<void>;
  /** Saves open documents, then downloads and installs the update and restarts. */
  install: () => Promise<void>;
}

/** Versions already announced in the notice bar this session. */
const announced = new Set<string>();

const downloadAction = {
  label: "Download",
  run: () => void openerService.openExternal(RELEASES_URL).catch(() => {}),
};

export const useUpdateStore = create<UpdateState>((set, get) => ({
  status: "idle",
  info: null,
  progress: null,
  error: null,

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
      set({ status: "available", info });
      if (!quiet || !announced.has(info.version)) {
        announced.add(info.version);
        showInfo(`MDExport v${info.version} is available.`, {
          label: "Update",
          run: () => void get().install(),
        });
      }
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
      set({ status: "error", progress: null, error: message });
      showError(`${message} You can download it from GitHub instead.`, downloadAction);
    }
  },
}));

export const checkForUpdates = (options?: { quiet?: boolean }) =>
  useUpdateStore.getState().check(options);
