use std::path::PathBuf;

use serde::{Deserialize, Serialize};

/// Small app config stored as JSON in the app config dir.
/// Moves into the SQLite `settings` table in Phase 6.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct AppConfig {
    pub library_path: Option<PathBuf>,
}
