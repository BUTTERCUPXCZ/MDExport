use serde::Serialize;

/// A Markdown file found in the library folder. Mirrored by `LibraryEntry` in `src/types/library.ts`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryEntry {
    /// Absolute path.
    pub path: String,
    /// Path relative to the library folder, `/`-separated, e.g. `backend/handovers/auth.md`.
    pub relative_path: String,
    /// File name including extension.
    pub name: String,
    /// Filesystem modification time, milliseconds since the Unix epoch.
    pub modified_ms: u64,
}

/// The library folder's contents: Markdown files plus every (non-hidden) folder,
/// so empty folders still show up in the UI.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryListing {
    pub root: String,
    /// Relative, `/`-separated folder paths.
    pub folders: Vec<String>,
    pub documents: Vec<LibraryEntry>,
    /// True if the scan stopped early because of the file limit.
    pub truncated: bool,
}
