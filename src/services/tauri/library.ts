import { invoke } from "@tauri-apps/api/core";
import type { LibraryListing } from "@/types/library";

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

  /** Folders and Markdown files in the library. */
  list(): Promise<LibraryListing> {
    return invoke("list_library");
  },

  /** Creates a top-level folder. Resolves its relative path. */
  createFolder(name: string): Promise<string> {
    return invoke("create_folder", { name });
  },
};
