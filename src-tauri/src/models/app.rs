use serde::Serialize;

/// Basic application metadata. Mirrored by `AppInfo` in `src/types/app.ts`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
}
