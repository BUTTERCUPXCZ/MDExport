//! Library folder location: where new documents are created.

use std::fs;
use std::path::{Path, PathBuf};

use crate::models::config::AppConfig;
use crate::models::error::{AppError, AppResult};
use crate::repositories::config_repository;

pub struct LibraryService {
    config_path: PathBuf,
}

impl LibraryService {
    pub fn new(config_path: PathBuf) -> Self {
        Self { config_path }
    }

    pub fn location(&self) -> Option<PathBuf> {
        config_repository::load(&self.config_path).library_path
    }

    /// Creates the folder if needed, stores it, and returns its canonical path.
    pub fn set_location(&self, dir: &Path) -> AppResult<PathBuf> {
        fs::create_dir_all(dir).map_err(|e| AppError::from_io(e, dir))?;
        let canonical = dir.canonicalize().map_err(|e| AppError::from_io(e, dir))?;

        let mut config: AppConfig = config_repository::load(&self.config_path);
        config.library_path = Some(canonical.clone());
        config_repository::save(&self.config_path, &config)?;
        Ok(canonical)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn location_is_unset_until_chosen_then_persists() {
        let root = tempfile::tempdir().unwrap();
        let config = root.path().join("config").join("config.json");
        let service = LibraryService::new(config.clone());
        assert_eq!(service.location(), None);

        let chosen = service
            .set_location(&root.path().join("Docs/MDForge"))
            .unwrap();

        assert!(chosen.is_dir());
        assert_eq!(LibraryService::new(config).location(), Some(chosen));
    }
}
