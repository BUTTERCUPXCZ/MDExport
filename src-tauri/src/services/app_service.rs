use crate::models::app::AppInfo;

pub const APP_NAME: &str = "MDForge";

pub fn app_info() -> AppInfo {
    AppInfo {
        name: APP_NAME.to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn app_info_reports_name_and_crate_version() {
        let info = app_info();

        assert_eq!(info.name, "MDForge");
        assert_eq!(info.version, env!("CARGO_PKG_VERSION"));
    }
}
