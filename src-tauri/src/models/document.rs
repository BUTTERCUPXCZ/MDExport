use serde::Serialize;

/// Identifies the exact on-disk state of a file when MDForge last read or wrote it.
/// Used to detect edits made outside MDForge before saving.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileVersion {
    /// SHA-256 of the file content, lowercase hex.
    pub hash: String,
    /// Filesystem modification time, milliseconds since the Unix epoch.
    pub modified_ms: u64,
}

/// Result of renaming a document: its new canonical path and file name.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RenamedDocument {
    pub path: String,
    pub name: String,
}

/// A Markdown file opened from disk. Mirrored by `DocumentFile` in `src/types/document.ts`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentFile {
    /// Canonical absolute path.
    pub path: String,
    /// File name including extension, e.g. `notes.md`.
    pub name: String,
    pub content: String,
    pub version: FileVersion,
}
