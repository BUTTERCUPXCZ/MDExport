//! Native dialogs run from Rust, so the frontend never needs dialog or fs permissions.

use std::path::{Path, PathBuf};

use tauri::{AppHandle, Window};
use tauri_plugin_dialog::{DialogExt, FileDialogBuilder};

use crate::models::error::{AppError, AppResult};

fn builder(
    app: &AppHandle,
    window: &Window,
    start_dir: Option<&Path>,
) -> FileDialogBuilder<tauri::Wry> {
    let mut dialog = app.dialog().file().set_parent(window);
    if let Some(dir) = start_dir {
        dialog = dialog.set_directory(dir);
    }
    dialog
}

/// Runs a blocking dialog off the async runtime's worker threads.
async fn run<F>(show: F) -> AppResult<Option<PathBuf>>
where
    F: FnOnce() -> Option<tauri_plugin_dialog::FilePath> + Send + 'static,
{
    let picked = tauri::async_runtime::spawn_blocking(show)
        .await
        .map_err(|e| AppError::Io(format!("Dialog failed: {e}")))?;
    picked
        .map(|p| p.into_path().map_err(|e| AppError::Io(e.to_string())))
        .transpose()
}

pub async fn pick_markdown_file(
    app: &AppHandle,
    window: &Window,
    start_dir: Option<&Path>,
) -> AppResult<Option<PathBuf>> {
    let dialog = builder(app, window, start_dir)
        .set_title("Open Markdown file")
        .add_filter("Markdown", &["md", "markdown"]);
    run(move || dialog.blocking_pick_file()).await
}

pub async fn pick_save_path(
    app: &AppHandle,
    window: &Window,
    start_dir: Option<&Path>,
    suggested_name: &str,
) -> AppResult<Option<PathBuf>> {
    let dialog = builder(app, window, start_dir)
        .set_title("Save Markdown file")
        .set_file_name(suggested_name)
        .add_filter("Markdown", &["md", "markdown"]);
    run(move || dialog.blocking_save_file()).await
}

pub async fn pick_folder(
    app: &AppHandle,
    window: &Window,
    start_dir: Option<&Path>,
) -> AppResult<Option<PathBuf>> {
    let dialog = builder(app, window, start_dir).set_title("Choose library folder");
    run(move || dialog.blocking_pick_folder()).await
}
