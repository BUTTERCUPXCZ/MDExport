use std::fs;
use std::path::Path;

use crate::models::config::AppConfig;
use crate::models::error::{AppError, AppResult};
use crate::repositories::file_repository;

/// Loads the config file. A missing or unreadable file yields the default config.
pub fn load(path: &Path) -> AppConfig {
    fs::read_to_string(path)
        .ok()
        .and_then(|json| serde_json::from_str(&json).ok())
        .unwrap_or_default()
}

pub fn save(path: &Path, config: &AppConfig) -> AppResult<()> {
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|e| AppError::from_io(e, dir))?;
    }
    let json = serde_json::to_string_pretty(config).map_err(|e| AppError::Io(e.to_string()))?;
    file_repository::write_text_atomic(path, &json).map(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn missing_or_corrupt_config_falls_back_to_default() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("config.json");
        assert_eq!(load(&path), AppConfig::default());

        fs::write(&path, "{ not json").unwrap();
        assert_eq!(load(&path), AppConfig::default());
    }

    #[test]
    fn save_then_load_round_trips() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("nested").join("config.json");
        let config = AppConfig {
            library_path: Some("/home/me/Documents/MDExport".into()),
        };

        save(&path, &config).unwrap();

        assert_eq!(load(&path), config);
    }
}
