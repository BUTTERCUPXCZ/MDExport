use crate::markdown;

/// Async so rendering runs off the main thread and never blocks the UI.
#[tauri::command]
pub async fn render_markdown(markdown: String) -> String {
    markdown::render_html(&markdown)
}
