use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri::ipc::Channel;
use tauri::{AppHandle, State, Window};
use tauri_plugin_opener::OpenerExt;

use crate::commands::dialog;
use crate::export::{self, ExportFormat, PdfPages};
use crate::models::error::{AppError, AppResult};
use crate::repositories::file_repository;
use crate::state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub path: String,
    pub name: String,
    /// Folder the file was saved in.
    pub folder: String,
}

/// Where an export is, sent while it runs (after the Save dialog).
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ExportStage {
    /// Laying out the document (PDF typesetting can take a few seconds).
    Converting,
    /// Writing the file to disk.
    Saving,
}

fn stem(file_name: &str) -> &str {
    Path::new(file_name)
        .file_stem()
        .and_then(|s| s.to_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("document")
}

fn with_extension(path: PathBuf, extension: &str) -> PathBuf {
    let has_it = path
        .extension()
        .is_some_and(|e| e.eq_ignore_ascii_case(extension));
    if has_it {
        path
    } else {
        let mut name = path.into_os_string();
        name.push(format!(".{extension}"));
        PathBuf::from(name)
    }
}

/// Converts the editor's Markdown (open file or pasted text) to PDF / DOCX / HTML.
/// Shows a Save dialog first; returns `None` if the user cancelled.
/// `source_path` (the open document, if any) picks the dialog's starting folder;
/// `pdf_pages` picks A4 pages or one continuous page for PDF; `on_progress` reports
/// each stage once a location is picked.
#[tauri::command]
// Each IPC field is its own argument; a struct would only rename them.
#[allow(clippy::too_many_arguments)]
pub async fn export_document(
    app: AppHandle,
    window: Window,
    state: State<'_, AppState>,
    content: String,
    format: ExportFormat,
    file_name: String,
    source_path: Option<String>,
    pdf_pages: Option<PdfPages>,
    on_progress: Channel<ExportStage>,
) -> AppResult<Option<ExportResult>> {
    let title = stem(&file_name).to_string();
    let start_dir = source_path
        .and_then(|p| state.scope.authorize(&p).ok())
        .and_then(|p| p.parent().map(Path::to_path_buf))
        .or_else(|| state.scope.library());
    let suggested = format!("{title}.{}", format.extension());

    let Some(target) = dialog::pick_export_path(
        &app,
        &window,
        start_dir.as_deref(),
        &suggested,
        format.label(),
        format.extension(),
    )
    .await?
    else {
        return Ok(None);
    };
    let target = with_extension(target, format.extension());

    // Typesetting can take a moment for long documents; keep it off the async workers.
    let _ = on_progress.send(ExportStage::Converting);
    let pages = pdf_pages.unwrap_or_default();
    let bytes = tauri::async_runtime::spawn_blocking(move || {
        export::export_with(&content, format, &title, pages)
    })
    .await
    .map_err(|e| AppError::Io(format!("Export failed: {e}")))??;
    let _ = on_progress.send(ExportStage::Saving);
    file_repository::write_bytes_atomic(&target, &bytes)?;

    let name = target
        .file_name()
        .map(|n| n.to_string_lossy().into_owned())
        .unwrap_or_default();
    let path = target.display().to_string();
    let folder = target
        .parent()
        .map(|p| p.display().to_string())
        .unwrap_or_default();
    state
        .exported
        .lock()
        .expect("exported lock poisoned")
        .insert(target);
    Ok(Some(ExportResult { path, name, folder }))
}

/// Only files exported this session may be opened or revealed.
fn exported_path(state: &AppState, path: String) -> AppResult<PathBuf> {
    let path = PathBuf::from(path);
    let allowed = state
        .exported
        .lock()
        .expect("exported lock poisoned")
        .contains(&path);
    if allowed {
        Ok(path)
    } else {
        Err(AppError::NotAllowed(path.display().to_string()))
    }
}

/// Opens a file exported this session with the system's default app.
#[tauri::command]
pub fn open_exported(app: AppHandle, state: State<'_, AppState>, path: String) -> AppResult<()> {
    let path = exported_path(&state, path)?;
    app.opener()
        .open_path(path.display().to_string(), None::<&str>)
        .map_err(|e| AppError::Io(format!("Couldn't open the file: {e}")))
}

/// Shows a file exported this session in the system file manager.
#[tauri::command]
pub fn reveal_exported(app: AppHandle, state: State<'_, AppState>, path: String) -> AppResult<()> {
    let path = exported_path(&state, path)?;
    app.opener()
        .reveal_item_in_dir(&path)
        .map_err(|e| AppError::Io(format!("Couldn't show the file: {e}")))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn suggested_names_and_extensions() {
        assert_eq!(stem("auth-flow.md"), "auth-flow");
        assert_eq!(stem(""), "document");
        assert_eq!(
            with_extension(PathBuf::from("/x/report"), "pdf"),
            PathBuf::from("/x/report.pdf")
        );
        assert_eq!(
            with_extension(PathBuf::from("/x/report.PDF"), "pdf"),
            PathBuf::from("/x/report.PDF")
        );
    }
}
