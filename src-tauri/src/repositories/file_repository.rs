//! Raw file access for Markdown documents. No access checks here; callers must
//! authorize paths through `AccessScope` first.

use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use sha2::{Digest, Sha256};

use crate::models::document::FileVersion;
use crate::models::error::{AppError, AppResult};

fn hash_hex(bytes: &[u8]) -> String {
    Sha256::digest(bytes)
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

fn version_of(path: &Path, bytes: &[u8]) -> AppResult<FileVersion> {
    let modified = fs::metadata(path)
        .and_then(|m| m.modified())
        .map_err(|e| AppError::from_io(e, path))?;
    let modified_ms = modified
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    Ok(FileVersion {
        hash: hash_hex(bytes),
        modified_ms,
    })
}

/// Reads a UTF-8 text file and returns its content with its current version.
pub fn read_text(path: &Path) -> AppResult<(String, FileVersion)> {
    let bytes = fs::read(path).map_err(|e| AppError::from_io(e, path))?;
    let version = version_of(path, &bytes)?;
    let content = String::from_utf8(bytes)
        .map_err(|_| AppError::Io(format!("Not a UTF-8 text file: {}", path.display())))?;
    Ok((content, version))
}

/// Current on-disk version, or `None` if the file no longer exists.
pub fn current_version(path: &Path) -> AppResult<Option<FileVersion>> {
    match fs::read(path) {
        Ok(bytes) => version_of(path, &bytes).map(Some),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(AppError::from_io(e, path)),
    }
}

fn temp_path_for(path: &Path) -> PathBuf {
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("document");
    path.with_file_name(format!(".{name}.mdforge-{}.tmp", std::process::id()))
}

/// Writes atomically: temp file in the same folder, fsync, then rename over the target.
/// A crash mid-save never leaves a half-written document. Keeps existing permissions.
pub fn write_text_atomic(path: &Path, content: &str) -> AppResult<FileVersion> {
    let temp = temp_path_for(path);
    let result = (|| {
        let mut file = fs::File::create(&temp)?;
        file.write_all(content.as_bytes())?;
        file.sync_all()?;
        if let Ok(meta) = fs::metadata(path) {
            fs::set_permissions(&temp, meta.permissions())?;
        }
        fs::rename(&temp, path)
    })();

    if let Err(e) = result {
        let _ = fs::remove_file(&temp);
        return Err(AppError::from_io(e, path));
    }
    version_of(path, content.as_bytes())
}

/// Creates a new file, failing if it already exists.
pub fn create_new(path: &Path, content: &str) -> AppResult<FileVersion> {
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(path)
        .map_err(|e| AppError::from_io(e, path))?;
    file.write_all(content.as_bytes())
        .map_err(|e| AppError::from_io(e, path))?;
    version_of(path, content.as_bytes())
}

/// Moves a file to the OS trash / recycle bin (recoverable).
pub fn move_to_trash(path: &Path) -> AppResult<()> {
    if !path.exists() {
        return Err(AppError::NotFound(path.display().to_string()));
    }
    trash::delete(path).map_err(|e| AppError::Io(format!("Could not move to trash: {e}")))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn write_then_read_round_trips_with_matching_version() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("a.md");

        let written = write_text_atomic(&path, "# Hi\n").unwrap();
        let (content, read) = read_text(&path).unwrap();

        assert_eq!(content, "# Hi\n");
        assert_eq!(written.hash, read.hash);
        assert_eq!(written.hash.len(), 64);
    }

    #[test]
    fn atomic_write_leaves_no_temp_file() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("a.md");
        write_text_atomic(&path, "one").unwrap();
        write_text_atomic(&path, "two").unwrap();

        let entries: Vec<_> = fs::read_dir(dir.path()).unwrap().collect();
        assert_eq!(entries.len(), 1);
        assert_eq!(fs::read_to_string(&path).unwrap(), "two");
    }

    #[test]
    fn reading_missing_file_is_not_found() {
        let dir = tempfile::tempdir().unwrap();
        let err = read_text(&dir.path().join("missing.md")).unwrap_err();
        assert!(matches!(err, AppError::NotFound(_)));
        assert_eq!(
            current_version(&dir.path().join("missing.md")).unwrap(),
            None
        );
    }

    #[test]
    fn reading_non_utf8_file_fails_cleanly() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("bin.md");
        fs::write(&path, [0xff, 0xfe, 0x00]).unwrap();
        assert!(matches!(read_text(&path).unwrap_err(), AppError::Io(_)));
    }

    #[test]
    fn create_new_refuses_to_overwrite() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("a.md");
        create_new(&path, "first").unwrap();
        assert!(create_new(&path, "second").is_err());
        assert_eq!(fs::read_to_string(&path).unwrap(), "first");
    }

    #[cfg(unix)]
    #[test]
    fn writing_into_read_only_folder_is_permission_denied() {
        use std::os::unix::fs::PermissionsExt;

        let dir = tempfile::tempdir().unwrap();
        let locked = dir.path().join("locked");
        fs::create_dir(&locked).unwrap();
        fs::set_permissions(&locked, fs::Permissions::from_mode(0o555)).unwrap();

        let result = write_text_atomic(&locked.join("a.md"), "x");
        fs::set_permissions(&locked, fs::Permissions::from_mode(0o755)).unwrap();

        // Running as root ignores permissions; only assert when the write was refused.
        if let Err(err) = result {
            assert!(matches!(err, AppError::PermissionDenied(_)), "{err:?}");
        }
    }

    #[cfg(unix)]
    #[test]
    fn atomic_write_keeps_file_permissions() {
        use std::os::unix::fs::PermissionsExt;

        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("a.md");
        fs::write(&path, "x").unwrap();
        fs::set_permissions(&path, fs::Permissions::from_mode(0o640)).unwrap();

        write_text_atomic(&path, "y").unwrap();

        let mode = fs::metadata(&path).unwrap().permissions().mode() & 0o777;
        assert_eq!(mode, 0o640);
    }
}
