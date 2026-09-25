import { create } from "zustand";
import { libraryService } from "@/services/tauri/library";
import type { LibraryListing } from "@/types/library";

interface LibraryState {
  listing: LibraryListing | null;
  status: "idle" | "loading" | "ready" | "error";
  /** Re-scans the library folder. Safe to call often; concurrent calls share one scan. */
  refresh: () => Promise<void>;
}

let inflight: Promise<void> | null = null;

export const useLibraryStore = create<LibraryState>((set) => ({
  listing: null,
  status: "idle",
  refresh() {
    inflight ??= (async () => {
      set((s) => ({ status: s.listing ? s.status : "loading" }));
      try {
        set({ listing: await libraryService.list(), status: "ready" });
      } catch {
        set({ status: "error" });
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  },
}));

export const refreshLibrary = () => useLibraryStore.getState().refresh();
