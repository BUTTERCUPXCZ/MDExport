import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Window controls for the custom title bar (the system title bar is turned off).
 * Methods are async so that failures outside Tauri reject instead of throwing.
 */
export const windowService = {
  async minimize(): Promise<void> {
    await getCurrentWindow().minimize();
  },

  async toggleMaximize(): Promise<void> {
    await getCurrentWindow().toggleMaximize();
  },

  async close(): Promise<void> {
    await getCurrentWindow().close();
  },

  async isMaximized(): Promise<boolean> {
    return getCurrentWindow().isMaximized();
  },

  /** Calls `callback` whenever the window is resized (incl. maximize/restore). */
  async onResized(callback: () => void): Promise<() => void> {
    return getCurrentWindow().onResized(callback);
  },
};
