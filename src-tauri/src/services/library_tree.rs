//! Reads the library folder's structure: folders and Markdown files.
//! Top-level folders become rail entries in the UI; nested folders become categories.

use std::fs;
use std::path::{Component, Path, PathBuf};
use std::time::UNIX_EPOCH;

use crate::models::error::{AppError, AppResult};
use crate::models::library::{LibraryEntry, LibraryListing};
use crate::services::access_scope::is_markdown;

const MAX_DEPTH: usize = 8;
const MAX_DOCUMENTS: usize = 5_000;
const MAX_NAME_LEN: usize = 64;
const SKIPPED_DIRS: [&str; 2] = ["node_modules", "target"];

fn is_hidden(name: &str) -> bool {
    name.starts_with('.')
}

fn relative(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .unwrap_or(path)
        .components()
        .map(|c| c.as_os_str().to_string_lossy())
        .collect::<Vec<_>>()
        .join("/")
}

fn modified_ms(meta: &fs::Metadata) -> u64 {
    meta.modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

/// Lists folders and Markdown files under `root`. Skips hidden entries, symlinks,
/// `node_modules`/`target`, and stops at `MAX_DEPTH` / `MAX_DOCUMENTS`.
/// Unreadable subfolders are skipped rather than failing the whole scan.
pub fn scan(root: &Path) -> AppResult<LibraryListing> {
    let mut listing = LibraryListing {
        root: root.display().to_string(),
        ..LibraryListing::default()
    };
    // Fail loudly only if the library folder itself can't be read.
    fs::read_dir(root).map_err(|e| AppError::from_io(e, root))?;

    let mut stack = vec![(root.to_path_buf(), 0usize)];
    while let Some((dir, depth)) = stack.pop() {
        let Ok(entries) = fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().into_owned();
            let Ok(file_type) = entry.file_type() else {
                continue;
            };
            if is_hidden(&name) || file_type.is_symlink() {
                continue;
            }
            let path = entry.path();

            if file_type.is_dir() {
                if depth + 1 < MAX_DEPTH && !SKIPPED_DIRS.contains(&name.as_str()) {
                    listing.folders.push(relative(root, &path));
                    stack.push((path, depth + 1));
                }
            } else if file_type.is_file() && is_markdown(&path) {
                if listing.documents.len() >= MAX_DOCUMENTS {
                    listing.truncated = true;
                    continue;
                }
                let modified = entry.metadata().map(|m| modified_ms(&m)).unwrap_or(0);
                listing.documents.push(LibraryEntry {
                    relative_path: relative(root, &path),
                    path: path.display().to_string(),
                    name,
                    modified_ms: modified,
                });
            }
        }
    }

    listing.folders.sort();
    listing.documents.sort_by(|a, b| {
        a.relative_path
            .to_lowercase()
            .cmp(&b.relative_path.to_lowercase())
    });
    Ok(listing)
}

/// Validates a single file or folder name typed by the user.
pub fn validate_name(name: &str) -> AppResult<&str> {
    let name = name.trim();
    let invalid = name.is_empty()
        || name.len() > MAX_NAME_LEN
        || is_hidden(name)
        || name.chars().any(|c| {
            matches!(c, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|') || c.is_control()
        });
    if invalid {
        return Err(AppError::InvalidName(name.to_string()));
    }
    Ok(name)
}

/// Resolves a `/`-separated folder path relative to the library. Rejects `..`,
/// absolute paths and hidden segments, then checks the result (if it exists)
/// really is inside the library after resolving symlinks.
pub fn resolve_folder(library: &Path, folder: &str) -> AppResult<PathBuf> {
    if folder.starts_with('/') || folder.starts_with('\\') {
        return Err(AppError::NotAllowed(folder.to_string()));
    }
    let mut path = library.to_path_buf();
    for part in folder.split('/').filter(|p| !p.is_empty()) {
        let valid = matches!(
            Path::new(part).components().next(),
            Some(Component::Normal(_))
        ) && Path::new(part).components().count() == 1
            && validate_name(part).is_ok();
        if !valid {
            return Err(AppError::NotAllowed(folder.to_string()));
        }
        path.push(part);
    }

    if path.exists() {
        let canonical = path
            .canonicalize()
            .map_err(|e| AppError::from_io(e, &path))?;
        let library = library
            .canonicalize()
            .map_err(|e| AppError::from_io(e, library))?;
        if !canonical.starts_with(&library) {
            return Err(AppError::NotAllowed(folder.to_string()));
        }
        return Ok(canonical);
    }
    Ok(path)
}

/// Creates a new top-level folder in the library and returns its relative path.
pub fn create_folder(library: &Path, name: &str) -> AppResult<String> {
    let name = validate_name(name)?;
    let path = library.join(name);
    if path.exists() {
        return Err(AppError::AlreadyExists(name.to_string()));
    }
    fs::create_dir(&path).map_err(|e| AppError::from_io(e, &path))?;
    Ok(name.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn touch(path: &Path) {
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(path, "# x").unwrap();
    }

    #[test]
    fn scan_lists_markdown_and_folders_sorted() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path();
        touch(&root.join("Readme.md"));
        touch(&root.join("backend/handovers/auth.md"));
        touch(&root.join("backend/api.markdown"));
        touch(&root.join("backend/notes.txt"));
        fs::create_dir_all(root.join("empty")).unwrap();

        let listing = scan(root).unwrap();

        let docs: Vec<_> = listing
            .documents
            .iter()
            .map(|d| d.relative_path.as_str())
            .collect();
        assert_eq!(
            docs,
            [
                "backend/api.markdown",
                "backend/handovers/auth.md",
                "Readme.md"
            ]
        );
        assert_eq!(listing.folders, ["backend", "backend/handovers", "empty"]);
        assert!(!listing.truncated);
        assert_eq!(listing.documents[1].name, "auth.md");
    }

    #[test]
    fn scan_skips_hidden_vendor_and_symlinked_entries() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path();
        touch(&root.join(".git/HEAD.md"));
        touch(&root.join(".draft.md"));
        touch(&root.join("node_modules/pkg/README.md"));
        touch(&root.join("ok.md"));
        #[cfg(unix)]
        {
            let outside = tempfile::tempdir().unwrap();
            touch(&outside.path().join("secret.md"));
            std::os::unix::fs::symlink(outside.path(), root.join("linked")).unwrap();
            std::os::unix::fs::symlink(outside.path().join("secret.md"), root.join("link.md"))
                .unwrap();
        }

        let listing = scan(root).unwrap();

        let docs: Vec<_> = listing
            .documents
            .iter()
            .map(|d| d.relative_path.as_str())
            .collect();
        assert_eq!(docs, ["ok.md"]);
        assert!(listing.folders.is_empty());
    }

    #[test]
    fn scan_missing_library_fails() {
        let dir = tempfile::tempdir().unwrap();
        assert!(matches!(
            scan(&dir.path().join("gone")),
            Err(AppError::NotFound(_))
        ));
    }

    #[test]
    fn resolve_folder_accepts_nested_relative_paths() {
        let dir = tempfile::tempdir().unwrap();
        let library = dir.path();
        fs::create_dir_all(library.join("backend/bugs")).unwrap();

        let resolved = resolve_folder(library, "backend/bugs").unwrap();
        assert_eq!(
            resolved,
            library.join("backend/bugs").canonicalize().unwrap()
        );

        // Not created yet: returned as-is (created later by the caller).
        assert_eq!(resolve_folder(library, "new").unwrap(), library.join("new"));
        assert_eq!(resolve_folder(library, "").unwrap(), library.to_path_buf());
    }

    #[test]
    fn resolve_folder_rejects_escapes() {
        let dir = tempfile::tempdir().unwrap();
        let library = dir.path();
        for bad in ["..", "a/../..", "/etc", ".hidden", "a\\b", "C:"] {
            assert!(
                matches!(resolve_folder(library, bad), Err(AppError::NotAllowed(_))),
                "{bad} should be rejected"
            );
        }
    }

    #[cfg(unix)]
    #[test]
    fn resolve_folder_rejects_symlink_escape() {
        let dir = tempfile::tempdir().unwrap();
        let outside = tempfile::tempdir().unwrap();
        std::os::unix::fs::symlink(outside.path(), dir.path().join("out")).unwrap();

        assert!(matches!(
            resolve_folder(dir.path(), "out"),
            Err(AppError::NotAllowed(_))
        ));
    }

    #[test]
    fn create_folder_validates_and_refuses_duplicates() {
        let dir = tempfile::tempdir().unwrap();
        let library = dir.path();

        assert_eq!(create_folder(library, "  Backend ").unwrap(), "Backend");
        assert!(library.join("Backend").is_dir());
        assert!(matches!(
            create_folder(library, "Backend"),
            Err(AppError::AlreadyExists(_))
        ));
        for bad in ["", "   ", "a/b", ".git", "x:y", &"a".repeat(65)] {
            assert!(
                matches!(create_folder(library, bad), Err(AppError::InvalidName(_))),
                "{bad:?} should be rejected"
            );
        }
    }
}
