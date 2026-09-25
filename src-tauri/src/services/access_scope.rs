//! Which files the frontend may touch. The frontend never gets general filesystem
//! access: a path is accepted only if it is inside the library folder or was
//! chosen by the user in a native file dialog during this session.

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, RwLock};

use crate::models::error::{AppError, AppResult};

const MARKDOWN_EXTENSIONS: [&str; 2] = ["md", "markdown"];

pub fn is_markdown(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .is_some_and(|ext| {
            MARKDOWN_EXTENSIONS
                .iter()
                .any(|m| ext.eq_ignore_ascii_case(m))
        })
}

/// Resolves `..`, `.` and symlinks. The file must exist.
fn canonicalize(path: &Path) -> AppResult<PathBuf> {
    if !path.is_absolute() {
        return Err(AppError::NotAllowed(path.display().to_string()));
    }
    path.canonicalize().map_err(|e| AppError::from_io(e, path))
}

fn canonical_markdown(path: &Path) -> AppResult<PathBuf> {
    let canonical = canonicalize(path)?;
    if !canonical.is_file() || !is_markdown(&canonical) {
        return Err(AppError::NotMarkdown(path.display().to_string()));
    }
    Ok(canonical)
}

#[derive(Default)]
pub struct AccessScope {
    granted: Mutex<HashSet<PathBuf>>,
    library: RwLock<Option<PathBuf>>,
}

impl AccessScope {
    pub fn new(library: Option<PathBuf>) -> Self {
        let scope = Self::default();
        if let Some(dir) = library {
            scope.set_library(&dir);
        }
        scope
    }

    /// Sets the library folder (canonicalized when it exists).
    pub fn set_library(&self, dir: &Path) {
        let dir = dir.canonicalize().unwrap_or_else(|_| dir.to_path_buf());
        *self.library.write().expect("library lock poisoned") = Some(dir);
    }

    pub fn library(&self) -> Option<PathBuf> {
        self.library.read().expect("library lock poisoned").clone()
    }

    /// Grants access to a file the user just chose in a native dialog.
    pub fn grant(&self, path: &Path) -> AppResult<PathBuf> {
        let canonical = canonical_markdown(path)?;
        self.granted
            .lock()
            .expect("granted lock poisoned")
            .insert(canonical.clone());
        Ok(canonical)
    }

    pub fn revoke(&self, path: &Path) {
        self.granted
            .lock()
            .expect("granted lock poisoned")
            .remove(path);
    }

    /// Validates a path sent by the frontend and returns its canonical form.
    pub fn authorize(&self, raw: &str) -> AppResult<PathBuf> {
        let canonical = canonical_markdown(Path::new(raw))?;

        let granted = self
            .granted
            .lock()
            .expect("granted lock poisoned")
            .contains(&canonical);
        let in_library = self
            .library()
            .is_some_and(|library| canonical.starts_with(library));

        if granted || in_library {
            Ok(canonical)
        } else {
            Err(AppError::NotAllowed(raw.to_string()))
        }
    }
}

#[cfg(test)]
mod tests {
    use std::fs;

    use super::*;

    fn setup() -> (tempfile::TempDir, PathBuf, PathBuf) {
        let root = tempfile::tempdir().unwrap();
        let library = root.path().join("library");
        let outside = root.path().join("outside");
        fs::create_dir_all(&library).unwrap();
        fs::create_dir_all(&outside).unwrap();
        (root, library, outside)
    }

    fn s(path: &Path) -> &str {
        path.to_str().unwrap()
    }

    #[test]
    fn allows_markdown_inside_library() {
        let (_root, library, _) = setup();
        let file = library.join("nested").join("a.md");
        fs::create_dir_all(file.parent().unwrap()).unwrap();
        fs::write(&file, "").unwrap();
        let scope = AccessScope::new(Some(library));

        assert_eq!(
            scope.authorize(s(&file)).unwrap(),
            file.canonicalize().unwrap()
        );
    }

    #[test]
    fn rejects_files_outside_library_until_granted() {
        let (_root, library, outside) = setup();
        let file = outside.join("b.md");
        fs::write(&file, "").unwrap();
        let scope = AccessScope::new(Some(library));

        assert!(matches!(
            scope.authorize(s(&file)),
            Err(AppError::NotAllowed(_))
        ));

        scope.grant(&file).unwrap();
        assert!(scope.authorize(s(&file)).is_ok());

        scope.revoke(&file.canonicalize().unwrap());
        assert!(matches!(
            scope.authorize(s(&file)),
            Err(AppError::NotAllowed(_))
        ));
    }

    #[test]
    fn rejects_dot_dot_traversal_out_of_library() {
        let (_root, library, outside) = setup();
        fs::write(outside.join("secret.md"), "").unwrap();
        let scope = AccessScope::new(Some(library.clone()));

        let sneaky = library.join("..").join("outside").join("secret.md");
        assert!(matches!(
            scope.authorize(s(&sneaky)),
            Err(AppError::NotAllowed(_))
        ));
    }

    #[cfg(unix)]
    #[test]
    fn rejects_symlink_escaping_library() {
        let (_root, library, outside) = setup();
        let target = outside.join("secret.md");
        fs::write(&target, "").unwrap();
        let link = library.join("link.md");
        std::os::unix::fs::symlink(&target, &link).unwrap();
        let scope = AccessScope::new(Some(library));

        assert!(matches!(
            scope.authorize(s(&link)),
            Err(AppError::NotAllowed(_))
        ));
    }

    #[test]
    fn rejects_non_markdown_and_relative_paths() {
        let (_root, library, _) = setup();
        let txt = library.join("notes.txt");
        fs::write(&txt, "").unwrap();
        let scope = AccessScope::new(Some(library));

        assert!(matches!(
            scope.authorize(s(&txt)),
            Err(AppError::NotMarkdown(_))
        ));
        assert!(matches!(
            scope.authorize("relative.md"),
            Err(AppError::NotAllowed(_))
        ));
        assert!(matches!(scope.grant(&txt), Err(AppError::NotMarkdown(_))));
    }

    #[test]
    fn missing_file_is_not_found() {
        let (_root, library, _) = setup();
        let scope = AccessScope::new(Some(library.clone()));

        assert!(matches!(
            scope.authorize(s(&library.join("missing.md"))),
            Err(AppError::NotFound(_))
        ));
    }

    #[test]
    fn nothing_is_allowed_without_library_or_grants() {
        let (_root, library, _) = setup();
        let file = library.join("a.md");
        fs::write(&file, "").unwrap();

        assert!(matches!(
            AccessScope::new(None).authorize(s(&file)),
            Err(AppError::NotAllowed(_))
        ));
    }

    #[test]
    fn markdown_extension_is_case_insensitive() {
        assert!(is_markdown(Path::new("/a/README.MD")));
        assert!(is_markdown(Path::new("/a/notes.markdown")));
        assert!(!is_markdown(Path::new("/a/notes.mdx")));
        assert!(!is_markdown(Path::new("/a/md")));
    }
}
