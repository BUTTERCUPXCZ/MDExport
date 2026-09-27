mod commands;
mod export;
mod markdown;
mod models;
mod repositories;
mod services;
mod state;

use tauri::Manager;

use crate::services::access_scope::AccessScope;
use crate::services::library_service::LibraryService;
use crate::state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let config_path = app.path().app_config_dir()?.join("config.json");
            let library = LibraryService::new(config_path);
            let scope = AccessScope::new(library.location());
            app.manage(AppState {
                scope,
                library,
                exported: Default::default(),
                pending_update: Default::default(),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::app::get_app_info,
            commands::markdown::render_markdown,
            commands::library::get_library_location,
            commands::library::get_default_library_location,
            commands::library::use_default_library_location,
            commands::library::choose_library_location,
            commands::library::list_library,
            commands::library::create_folder,
            commands::library::delete_folder,
            commands::document::open_document_dialog,
            commands::document::open_document,
            commands::document::create_document,
            commands::document::save_document,
            commands::document::save_document_as,
            commands::document::delete_document,
            commands::document::rename_document,
            commands::export::export_document,
            commands::export::open_exported,
            commands::update::check_for_update,
            commands::update::install_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
