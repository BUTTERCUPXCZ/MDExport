/** Mirrors `models::library::LibraryEntry` in Rust. */
export interface LibraryEntry {
  path: string;
  /** `/`-separated, relative to the library folder. */
  relativePath: string;
  name: string;
  modifiedMs: number;
}

/** Mirrors `models::library::LibraryListing` in Rust. */
export interface LibraryListing {
  root: string;
  folders: string[];
  documents: LibraryEntry[];
  truncated: boolean;
}
