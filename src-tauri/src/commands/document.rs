use tauri::{AppHandle, State, Window};

use crate::commands::dialog;
use crate::models::document::{DocumentFile, FileVersion, RenamedDocument};
use crate::models::error::{AppError, AppResult};
use crate::services::{document_service, library_tree};
use crate::state::AppState;

/// Shows the Open dialog. Returns `None` if the user cancelled.
#[tauri::command]
pub async fn open_document_dialog(
    app: AppHandle,
    window: Window,
    state: State<'_, AppState>,
) -> AppResult<Option<DocumentFile>> {
    let start = state.scope.library();
    let Some(picked) = dialog::pick_markdown_file(&app, &window, start.as_deref()).await? else {
        return Ok(None);
    };
    let path = state.scope.grant(&picked)?;
    document_service::open(&path).map(Some)
}

/// Re-reads a document the frontend already has access to (e.g. "Reload from disk").
#[tauri::command]
pub fn open_document(state: State<'_, AppState>, path: String) -> AppResult<DocumentFile> {
    document_service::open(&state.scope.authorize(&path)?)
}

/// Creates a new empty document in the library, optionally in a subfolder
/// (`/`-separated, relative to the library).
#[tauri::command]
pub fn create_document(
    state: State<'_, AppState>,
    folder: Option<String>,
) -> AppResult<DocumentFile> {
    let library = state
        .scope
        .library()
        .ok_or(AppError::LibraryNotConfigured)?;
    let dir = library_tree::resolve_folder(&library, folder.as_deref().unwrap_or(""))?;
    document_service::create_in(&dir)
}

#[tauri::command]
pub fn save_document(
    state: State<'_, AppState>,
    path: String,
    content: String,
    expected_hash: Option<String>,
    force: bool,
) -> AppResult<FileVersion> {
    let path = state.scope.authorize(&path)?;
    document_service::save(&path, &content, expected_hash.as_deref(), force)
}

/// Shows the Save As dialog and writes there. Returns `None` if the user cancelled.
#[tauri::command]
pub async fn save_document_as(
    app: AppHandle,
    window: Window,
    state: State<'_, AppState>,
    content: String,
    suggested_name: String,
) -> AppResult<Option<DocumentFile>> {
    let start = state.scope.library();
    let Some(picked) =
        dialog::pick_save_path(&app, &window, start.as_deref(), &suggested_name).await?
    else {
        return Ok(None);
    };
    let saved = document_service::save_as(&picked, &content)?;
    let path = state.scope.grant(std::path::Path::new(&saved.path))?;
    Ok(Some(DocumentFile {
        path: path.display().to_string(),
        ..saved
    }))
}

/// Moves the document to the OS trash.
#[tauri::command]
pub fn delete_document(state: State<'_, AppState>, path: String) -> AppResult<()> {
    let path = state.scope.authorize(&path)?;
    document_service::delete(&path)?;
    state.scope.revoke(&path);
    Ok(())
}

/// Renames a document within its folder (e.g. `Untitled.md` → `auth-flow.md`).
#[tauri::command]
pub fn rename_document(
    state: State<'_, AppState>,
    path: String,
    new_name: String,
) -> AppResult<RenamedDocument> {
    let old = state.scope.authorize(&path)?;
    let new = document_service::rename(&old, &new_name)?;
    // Keep access for files outside the library that were granted by a dialog.
    state.scope.revoke(&old);
    let new = state.scope.grant(&new)?;
    Ok(RenamedDocument {
        name: new
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default(),
        path: new.display().to_string(),
    })
}
