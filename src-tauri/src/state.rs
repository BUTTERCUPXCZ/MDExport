use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::Mutex;

use tauri_plugin_updater::Update;

use crate::services::access_scope::AccessScope;
use crate::services::library_service::LibraryService;

/// Shared app state, managed by Tauri.
pub struct AppState {
    pub scope: AccessScope,
    pub library: LibraryService,
    /// Files exported this session; only these may be opened with "Open".
    pub exported: Mutex<HashSet<PathBuf>>,
    /// Update found by the last check, waiting to be installed.
    pub pending_update: Mutex<Option<Update>>,
}
