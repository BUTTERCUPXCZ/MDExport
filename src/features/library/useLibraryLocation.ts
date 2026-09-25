import { create } from "zustand";
import { libraryService } from "@/services/tauri/library";

interface LibraryLocationState {
  /** `undefined` until loaded, `null` when not configured yet. */
  location: string | null | undefined;
  load: () => Promise<string | null>;
  set: (location: string) => void;
}

export const useLibraryLocation = create<LibraryLocationState>((set) => ({
  location: undefined,
  async load() {
    const location = await libraryService.getLocation();
    set({ location });
    return location;
  },
  set: (location) => set({ location }),
}));
