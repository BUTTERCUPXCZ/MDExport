use crate::models::app::AppInfo;
use crate::services::app_service;

#[tauri::command]
pub fn get_app_info() -> AppInfo {
    app_service::app_info()
}
