/** Mirrors `models::update::UpdateInfo` in Rust. */
export interface UpdateInfo {
  version: string;
  currentVersion: string;
  notes: string | null;
}

/** Mirrors `models::update::UpdateProgress` in Rust. */
export interface UpdateProgress {
  downloaded: number;
  total: number | null;
}
