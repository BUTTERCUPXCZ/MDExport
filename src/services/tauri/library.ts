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

  /** Creates a folder inside `parent` (relative; library root if omitted). Resolves its relative path. */
  createFolder(name: string, parent?: string): Promise<string> {
    return invoke("create_folder", { name, parent: parent || null });
  },

  /** Moves a library folder and everything in it to the system trash. */
  deleteFolder(folder: string): Promise<void> {
    return invoke("delete_folder", { folder });
  },
};
