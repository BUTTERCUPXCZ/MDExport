use std::io;
use std::path::Path;

use serde::ser::SerializeStruct;
use serde::{Serialize, Serializer};

use crate::models::document::FileVersion;

/// Errors returned to the frontend. Serialized as `{ kind, message, current? }`.
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("File not found: {0}")]
    NotFound(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("The file changed on disk since it was opened")]
    Conflict { current: FileVersion },

    #[error("MDForge is not allowed to access this path: {0}")]
    NotAllowed(String),

    #[error("Not a Markdown file: {0}")]
    NotMarkdown(String),

    #[error("The library folder is not set up yet")]
    LibraryNotConfigured,

    #[error("{0}")]
    Io(String),
}

impl AppError {
    fn kind(&self) -> &'static str {
        match self {
            AppError::NotFound(_) => "notFound",
            AppError::PermissionDenied(_) => "permissionDenied",
            AppError::Conflict { .. } => "conflict",
            AppError::NotAllowed(_) => "notAllowed",
            AppError::NotMarkdown(_) => "notMarkdown",
            AppError::LibraryNotConfigured => "libraryNotConfigured",
            AppError::Io(_) => "io",
        }
    }

    /// Maps an I/O error on `path` to a user-facing error.
    pub fn from_io(error: io::Error, path: &Path) -> Self {
        let path = path.display().to_string();
        match error.kind() {
            io::ErrorKind::NotFound => AppError::NotFound(path),
            io::ErrorKind::PermissionDenied | io::ErrorKind::ReadOnlyFilesystem => {
                AppError::PermissionDenied(path)
            }
            _ => AppError::Io(format!("{error} ({path})")),
        }
    }
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut state = serializer.serialize_struct("AppError", 3)?;
        state.serialize_field("kind", self.kind())?;
        state.serialize_field("message", &self.to_string())?;
        match self {
            AppError::Conflict { current } => state.serialize_field("current", current)?,
            _ => state.skip_field("current")?,
        }
        state.end()
    }
}

pub type AppResult<T> = Result<T, AppError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_kind_and_message() {
        let json = serde_json::to_value(AppError::NotFound("/a.md".into())).unwrap();
        assert_eq!(
            json,
            serde_json::json!({ "kind": "notFound", "message": "File not found: /a.md" })
        );
    }

    #[test]
    fn conflict_includes_current_version() {
        let current = FileVersion {
            hash: "abc".into(),
            modified_ms: 1,
        };
        let json = serde_json::to_value(AppError::Conflict { current }).unwrap();
        assert_eq!(json["kind"], "conflict");
        assert_eq!(json["current"]["hash"], "abc");
        assert_eq!(json["current"]["modifiedMs"], 1);
    }

    #[test]
    fn maps_io_error_kinds() {
        let path = Path::new("/x.md");
        assert!(matches!(
            AppError::from_io(io::ErrorKind::NotFound.into(), path),
            AppError::NotFound(_)
        ));
        assert!(matches!(
            AppError::from_io(io::ErrorKind::PermissionDenied.into(), path),
            AppError::PermissionDenied(_)
        ));
        assert!(matches!(
            AppError::from_io(io::ErrorKind::Other.into(), path),
            AppError::Io(_)
        ));
    }
}
