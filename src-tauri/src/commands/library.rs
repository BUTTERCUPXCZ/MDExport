use std::path::PathBuf;

use tauri::{AppHandle, Manager, State, Window};

use crate::commands::dialog;
use crate::models::error::{AppError, AppResult};
use crate::state::AppState;

fn default_location(app: &AppHandle) -> AppResult<PathBuf> {
    let base = app
        .path()
        .document_dir()
        .or_else(|_| app.path().home_dir())
        .map_err(|e| AppError::Io(e.to_string()))?;
    Ok(base.join("MDForge"))
}

fn apply(state: &AppState, dir: &std::path::Path) -> AppResult<String> {
    let canonical = state.library.set_location(dir)?;
    state.scope.set_library(&canonical);
    Ok(canonical.display().to_string())
}

#[tauri::command]
pub fn get_library_location(state: State<'_, AppState>) -> Option<String> {
    state.scope.library().map(|p| p.display().to_string())
}

#[tauri::command]
pub fn get_default_library_location(app: AppHandle) -> AppResult<String> {
    default_location(&app).map(|p| p.display().to_string())
}

#[tauri::command]
pub fn use_default_library_location(
    app: AppHandle,
    state: State<'_, AppState>,
) -> AppResult<String> {
    apply(&state, &default_location(&app)?)
}

/// Returns `None` if the user cancelled the dialog.
#[tauri::command]
pub async fn choose_library_location(
    app: AppHandle,
    window: Window,
    state: State<'_, AppState>,
) -> AppResult<Option<String>> {
    let start = state
        .scope
        .library()
        .or_else(|| default_location(&app).ok());
    match dialog::pick_folder(&app, &window, start.as_deref()).await? {
        Some(dir) => apply(&state, &dir).map(Some),
        None => Ok(None),
    }
}
