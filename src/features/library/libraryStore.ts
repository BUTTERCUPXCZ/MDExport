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

/** True when two scans list the same folders and files with the same timestamps. */
export function sameListing(a: LibraryListing | null, b: LibraryListing): boolean {
  if (!a || a.root !== b.root || a.truncated !== b.truncated) return false;
  if (a.folders.length !== b.folders.length || a.documents.length !== b.documents.length) {
    return false;
  }
  return (
    a.folders.every((f, i) => f === b.folders[i]) &&
    a.documents.every((d, i) => {
      const other = b.documents[i]!;
      return d.path === other.path && d.modifiedMs === other.modifiedMs;
    })
  );
}

export const useLibraryStore = create<LibraryState>((set) => ({
  listing: null,
  status: "idle",
  refresh() {
    inflight ??= (async () => {
      set((s) => ({ status: s.listing ? s.status : "loading" }));
      try {
        const listing = await libraryService.list();
        // Keep the old object when nothing changed, so the index doesn't re-render.
        set((s) => ({
          listing: sameListing(s.listing, listing) ? s.listing : listing,
          status: "ready",
        }));
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
