use crate::services::access_scope::AccessScope;
use crate::services::library_service::LibraryService;

/// Shared app state, managed by Tauri.
pub struct AppState {
    pub scope: AccessScope,
    pub library: LibraryService,
}
