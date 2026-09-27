use serde::Serialize;

/// A newer release found by the update check. Mirrored by `UpdateInfo` in `src/types/update.ts`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    /// Version of the new release, e.g. `0.3.0`.
    pub version: String,
    /// Version running now.
    pub current_version: String,
    /// Release notes, if the release has any.
    pub notes: Option<String>,
}

/// Download progress of an update, sent to the frontend while it installs.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProgress {
    /// Bytes downloaded so far.
    pub downloaded: u64,
    /// Total size in bytes, when the server reports it.
    pub total: Option<u64>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_camel_case() {
        let info = UpdateInfo {
            version: "0.3.0".into(),
            current_version: "0.2.0".into(),
            notes: None,
        };
        assert_eq!(
            serde_json::to_value(info).unwrap(),
            serde_json::json!({ "version": "0.3.0", "currentVersion": "0.2.0", "notes": null })
        );
        let progress = UpdateProgress {
            downloaded: 10,
            total: Some(100),
        };
        assert_eq!(
            serde_json::to_value(progress).unwrap(),
            serde_json::json!({ "downloaded": 10, "total": 100 })
        );
    }
}
