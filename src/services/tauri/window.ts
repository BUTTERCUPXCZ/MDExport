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

  /** Closes the window for real, skipping close-requested listeners (after the unsaved check). */
  async destroy(): Promise<void> {
    await getCurrentWindow().destroy();
  },

  /**
   * Runs `handler` when the user asks to close the window (title bar, Alt+F4, dock).
   * The window closes afterwards unless the handler calls `event.preventDefault()`.
   */
  async onCloseRequested(
    handler: (event: { preventDefault: () => void }) => void | Promise<void>,
  ): Promise<() => void> {
    return getCurrentWindow().onCloseRequested(handler);
  },

  /** Calls `callback` whenever the window is resized (incl. maximize/restore). */
  async onResized(callback: () => void): Promise<() => void> {
    return getCurrentWindow().onResized(callback);
  },
};
