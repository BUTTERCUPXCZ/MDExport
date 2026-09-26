use crate::markdown;

/// Renders on the blocking thread pool: parsing and highlighting are CPU work,
/// so they must not tie up the async workers that serve other commands (save, list).
#[tauri::command]
pub async fn render_markdown(markdown: String) -> String {
    tauri::async_runtime::spawn_blocking(move || markdown::render_html(&markdown))
        .await
        .unwrap_or_default()
}
