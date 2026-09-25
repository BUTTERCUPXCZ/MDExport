import { invoke } from "@tauri-apps/api/core";

export const libraryService = {
  /** Current library folder, or `null` on first launch. */
  getLocation(): Promise<string | null> {
    return invoke("get_library_location");
  },

  getDefaultLocation(): Promise<string> {
    return invoke("get_default_library_location");
  },

  /** Creates and uses `~/Documents/MDForge`. */
  useDefaultLocation(): Promise<string> {
    return invoke("use_default_library_location");
  },

  /** Shows a folder picker. Resolves `null` if cancelled. */
  chooseLocation(): Promise<string | null> {
    return invoke("choose_library_location");
  },
};
