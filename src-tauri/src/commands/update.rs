//! In-app updates via `tauri-plugin-updater`. Releases are signed in CI and listed
//! in `latest.json` on the latest published GitHub release (see `tauri.conf.json`).

use tauri::ipc::Channel;
use tauri::{AppHandle, State};
use tauri_plugin_updater::UpdaterExt;

use crate::models::error::{AppError, AppResult};
use crate::models::update::{UpdateInfo, UpdateProgress};
use crate::state::AppState;

/// Checks for a newer release. Returns `None` when this version is the latest.
/// The update found is kept so `install_update` installs exactly what was shown.
#[tauri::command]
pub async fn check_for_update(
    app: AppHandle,
    state: State<'_, AppState>,
) -> AppResult<Option<UpdateInfo>> {
    let update = app
        .updater()
        .map_err(|e| AppError::Io(format!("Couldn't check for updates: {e}")))?
        .check()
        .await
        .map_err(|e| AppError::Io(format!("Couldn't check for updates: {e}")))?;

    let info = update.as_ref().map(|u| UpdateInfo {
        version: u.version.clone(),
        current_version: u.current_version.clone(),
        notes: u.body.clone().filter(|b| !b.trim().is_empty()),
    });
    *state.pending_update.lock().expect("update lock poisoned") = update;
    Ok(info)
}

/// Downloads and installs the update found by the last check, reporting progress
/// on `on_progress`, then restarts the app on the new version.
#[tauri::command]
pub async fn install_update(
    app: AppHandle,
    state: State<'_, AppState>,
    on_progress: Channel<UpdateProgress>,
) -> AppResult<()> {
    let update = state
        .pending_update
        .lock()
        .expect("update lock poisoned")
        .take()
        .ok_or_else(|| AppError::Io("No update to install. Check for updates first.".into()))?;

    let mut downloaded = 0u64;
    update
        .download_and_install(
            |chunk, total| {
                downloaded += chunk as u64;
                let _ = on_progress.send(UpdateProgress { downloaded, total });
            },
            || {},
        )
        .await
        .map_err(|e| AppError::Io(format!("Couldn't install the update: {e}")))?;

    app.restart()
}
