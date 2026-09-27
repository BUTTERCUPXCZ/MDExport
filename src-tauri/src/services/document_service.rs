//! Document file operations. Paths must already be authorized by `AccessScope`.

use std::fs;
use std::path::{Path, PathBuf};

use crate::models::document::{DocumentFile, FileVersion};
use crate::models::error::{AppError, AppResult};
use crate::repositories::file_repository;
use crate::services::access_scope::is_markdown;
use crate::services::library_tree;

const NEW_DOCUMENT_STEM: &str = "Untitled";
const MAX_UNTITLED: u32 = 10_000;

fn file_name(path: &Path) -> String {
    path.file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default()
}

fn document(path: &Path, content: String, version: FileVersion) -> DocumentFile {
    DocumentFile {
        path: path.display().to_string(),
        name: file_name(path),
        content,
        version,
    }
}

pub fn open(path: &Path) -> AppResult<DocumentFile> {
    let (content, version) = file_repository::read_text(path)?;
    Ok(document(path, content, version))
}

/// Saves `content`. Unless `force` is set, refuses with `Conflict` when the file
/// changed on disk since the version the editor last saw (`expected_hash`).
/// A file deleted externally is simply recreated.
pub fn save(
    path: &Path,
    content: &str,
    expected_hash: Option<&str>,
    force: bool,
) -> AppResult<FileVersion> {
    if !force {
        if let (Some(expected), Some(current)) =
            (expected_hash, file_repository::current_version(path)?)
        {
            if current.hash != expected {
                return Err(AppError::Conflict { current });
            }
        }
    }
    file_repository::write_text_atomic(path, content)
}

/// Writes to a path chosen in a Save As dialog, adding `.md` if needed.
pub fn save_as(path: &Path, content: &str) -> AppResult<DocumentFile> {
    let path = with_markdown_extension(path);
    let version = file_repository::write_text_atomic(&path, content)?;
    Ok(document(&path, content.to_string(), version))
}

pub fn with_markdown_extension(path: &Path) -> PathBuf {
    if is_markdown(path) {
        path.to_path_buf()
    } else {
        let mut name = path.as_os_str().to_owned();
        name.push(".md");
        PathBuf::from(name)
    }
}

/// Creates an empty `Untitled.md` (or `Untitled 2.md`, …) in `dir`.
pub fn create_in(dir: &Path) -> AppResult<DocumentFile> {
    fs::create_dir_all(dir).map_err(|e| AppError::from_io(e, dir))?;

    for n in 1..=MAX_UNTITLED {
        let name = match n {
            1 => format!("{NEW_DOCUMENT_STEM}.md"),
            _ => format!("{NEW_DOCUMENT_STEM} {n}.md"),
        };
        let path = dir.join(name);
        if path.exists() {
            continue;
        }
        match file_repository::create_new(&path, "") {
            Ok(version) => {
                let canonical = path
                    .canonicalize()
                    .map_err(|e| AppError::from_io(e, &path))?;
                return Ok(document(&canonical, String::new(), version));
            }
            // Lost a race with another process creating the same name; try the next one.
            Err(_) if path.exists() => continue,
            Err(e) => return Err(e),
        }
    }
    Err(AppError::Io(format!(
        "Too many untitled documents in {}",
        dir.display()
    )))
}

/// Creates an empty document named `name` in `dir` (`.md` is added when missing).
/// Refuses names that already exist.
pub fn create_named(dir: &Path, name: &str) -> AppResult<DocumentFile> {
    let name = library_tree::validate_name(name)?;
    if !dir.is_dir() {
        return Err(AppError::NotFound(dir.display().to_string()));
    }
    let path = with_markdown_extension(&dir.join(name));
    if path.exists() {
        return Err(AppError::AlreadyExists(file_name(&path)));
    }
    let version = file_repository::create_new(&path, "")?;
    let canonical = path
        .canonicalize()
        .map_err(|e| AppError::from_io(e, &path))?;
    Ok(document(&canonical, String::new(), version))
}

pub fn delete(path: &Path) -> AppResult<()> {
    file_repository::move_to_trash(path)
}

/// Renames a document within its folder. `new_name` may omit the extension
/// (`.md` is added). Never overwrites another file; a case-only rename of the
/// same file (e.g. `untitled.md` → `Untitled.md`) is allowed.
pub fn rename(path: &Path, new_name: &str) -> AppResult<PathBuf> {
    let name = library_tree::validate_name(new_name)?;
    let dir = path
        .parent()
        .ok_or_else(|| AppError::NotAllowed(path.display().to_string()))?;
    let target = with_markdown_extension(&dir.join(name));
    if target == path {
        return Ok(target);
    }
    if !path.exists() {
        return Err(AppError::NotFound(path.display().to_string()));
    }
    if target.exists() {
        let same_file = target.canonicalize().ok() == path.canonicalize().ok();
        if !same_file {
            return Err(AppError::AlreadyExists(file_name(&target)));
        }
    }
    fs::rename(path, &target).map_err(|e| AppError::from_io(e, path))?;
    Ok(target)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_named_adds_the_extension_and_refuses_duplicates() {
        let dir = tempfile::tempdir().unwrap();

        let file = create_named(dir.path(), " auth flow ").unwrap();
        assert_eq!(file.name, "auth flow.md");
        assert!(dir.path().join("auth flow.md").is_file());
        assert_eq!(
            create_named(dir.path(), "notes.md").unwrap().name,
            "notes.md"
        );
        assert!(matches!(
            create_named(dir.path(), "auth flow"),
            Err(AppError::AlreadyExists(_))
        ));
        assert!(matches!(
            create_named(dir.path(), "a/b"),
            Err(AppError::InvalidName(_))
        ));
        assert!(matches!(
            create_named(&dir.path().join("missing"), "x"),
            Err(AppError::NotFound(_))
        ));
    }

    #[test]
    fn open_returns_content_name_and_version() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("Bug Fix.md");
        fs::write(&path, "# Bug Fix").unwrap();

        let doc = open(&path).unwrap();

        assert_eq!(doc.name, "Bug Fix.md");
        assert_eq!(doc.content, "# Bug Fix");
        assert_eq!(doc.path, path.display().to_string());
    }

    #[test]
    fn save_succeeds_when_disk_matches_expected_version() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("a.md");
        fs::write(&path, "v1").unwrap();
        let opened = open(&path).unwrap();

        let saved = save(&path, "v2", Some(&opened.version.hash), false).unwrap();

        assert_eq!(fs::read_to_string(&path).unwrap(), "v2");
        assert_ne!(saved.hash, opened.version.hash);
    }

    #[test]
    fn save_detects_external_modification() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("a.md");
        fs::write(&path, "v1").unwrap();
        let opened = open(&path).unwrap();
        fs::write(&path, "changed in VS Code").unwrap();

        let err = save(&path, "mine", Some(&opened.version.hash), false).unwrap_err();

        match err {
            AppError::Conflict { current } => assert_ne!(current.hash, opened.version.hash),
            other => panic!("expected conflict, got {other:?}"),
        }
        assert_eq!(fs::read_to_string(&path).unwrap(), "changed in VS Code");
    }

    #[test]
    fn force_save_overwrites_external_modification() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("a.md");
        fs::write(&path, "v1").unwrap();
        let opened = open(&path).unwrap();
        fs::write(&path, "external").unwrap();

        save(&path, "mine", Some(&opened.version.hash), true).unwrap();

        assert_eq!(fs::read_to_string(&path).unwrap(), "mine");
    }

    #[test]
    fn save_recreates_externally_deleted_file() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("a.md");
        fs::write(&path, "v1").unwrap();
        let opened = open(&path).unwrap();
        fs::remove_file(&path).unwrap();

        save(&path, "mine", Some(&opened.version.hash), false).unwrap();

        assert_eq!(fs::read_to_string(&path).unwrap(), "mine");
    }

    #[test]
    fn create_in_picks_unique_untitled_names() {
        let dir = tempfile::tempdir().unwrap();
        let library = dir.path().join("MDExport");

        let first = create_in(&library).unwrap();
        let second = create_in(&library).unwrap();

        assert_eq!(first.name, "Untitled.md");
        assert_eq!(second.name, "Untitled 2.md");
        assert_eq!(first.content, "");
        assert!(library.join("Untitled 2.md").exists());
    }

    #[test]
    fn save_as_adds_markdown_extension() {
        let dir = tempfile::tempdir().unwrap();

        let doc = save_as(&dir.path().join("handover"), "# Handover").unwrap();

        assert_eq!(doc.name, "handover.md");
        assert_eq!(
            fs::read_to_string(dir.path().join("handover.md")).unwrap(),
            "# Handover"
        );
        assert_eq!(
            with_markdown_extension(Path::new("/a/b.markdown")),
            PathBuf::from("/a/b.markdown")
        );
    }

    #[test]
    fn rename_keeps_folder_and_content_and_adds_extension() {
        let dir = tempfile::tempdir().unwrap();
        let old = dir.path().join("Untitled.md");
        fs::write(&old, "# Notes").unwrap();

        let new = rename(&old, "  auth-flow ").unwrap();

        assert_eq!(new, dir.path().join("auth-flow.md"));
        assert!(!old.exists());
        assert_eq!(fs::read_to_string(&new).unwrap(), "# Notes");
        assert_eq!(
            rename(&new, "auth-flow.markdown").unwrap(),
            dir.path().join("auth-flow.markdown")
        );
    }

    #[test]
    fn rename_to_same_name_is_a_no_op() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("a.md");
        fs::write(&path, "x").unwrap();

        assert_eq!(rename(&path, "a").unwrap(), path);
        assert!(path.exists());
    }

    #[test]
    fn rename_never_overwrites_another_file() {
        let dir = tempfile::tempdir().unwrap();
        let a = dir.path().join("a.md");
        let b = dir.path().join("b.md");
        fs::write(&a, "A").unwrap();
        fs::write(&b, "B").unwrap();

        assert!(matches!(rename(&a, "b"), Err(AppError::AlreadyExists(name)) if name == "b.md"));
        assert_eq!(fs::read_to_string(&b).unwrap(), "B");
        assert!(a.exists());
    }

    #[test]
    fn rename_rejects_invalid_names_and_missing_files() {
        let dir = tempfile::tempdir().unwrap();
        let a = dir.path().join("a.md");
        fs::write(&a, "A").unwrap();

        for bad in ["", "  ", "../escape", "sub/dir", ".hidden", "a:b"] {
            assert!(
                matches!(rename(&a, bad), Err(AppError::InvalidName(_))),
                "{bad:?} should be rejected"
            );
        }
        assert!(matches!(
            rename(&dir.path().join("gone.md"), "x"),
            Err(AppError::NotFound(_))
        ));
    }

    #[test]
    fn rename_allows_case_only_change() {
        let dir = tempfile::tempdir().unwrap();
        let old = dir.path().join("untitled.md");
        fs::write(&old, "x").unwrap();

        let new = rename(&old, "Untitled").unwrap();

        assert_eq!(new.file_name().unwrap(), "Untitled.md");
        assert_eq!(fs::read_to_string(&new).unwrap(), "x");
    }

    #[test]
    fn delete_missing_file_is_not_found() {
        let dir = tempfile::tempdir().unwrap();
        assert!(matches!(
            delete(&dir.path().join("gone.md")),
            Err(AppError::NotFound(_))
        ));
    }
}
