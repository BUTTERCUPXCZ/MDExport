//! Standalone HTML: the preview's HTML plus an inline, print-friendly stylesheet.
//! No scripts and no external resources, so the file opens anywhere offline.

use crate::markdown;

const STYLE: &str = r#"
:root { color-scheme: light; }
body { margin: 0; background: #fff; color: #1f2328;
  font: 16px/1.6 -apple-system, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; }
main { max-width: 800px; margin: 0 auto; padding: 48px 32px; }
h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 1.5em 0 0.5em; }
h1 { font-size: 2em; padding-bottom: .3em; border-bottom: 1px solid #d1d9e0; margin-top: 0; }
h2 { font-size: 1.5em; padding-bottom: .3em; border-bottom: 1px solid #d1d9e0; }
h3 { font-size: 1.25em; }
.anchor { display: none; }
a { color: #0969da; }
code { font: .85em/1.45 "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  background: #f3f4f6; padding: .15em .35em; border-radius: 4px; }
pre { background: #f6f8fa; border: 1px solid #d1d9e0; border-radius: 6px; padding: 12px 16px; overflow: auto; }
pre code { background: none; padding: 0; font-size: 14px; }
blockquote { margin: 0 0 1em; padding: 0 1em; color: #59636e; border-left: 4px solid #d1d9e0; }
table { border-collapse: collapse; margin: 0 0 1em; }
th, td { border: 1px solid #d1d9e0; padding: 6px 13px; }
th { background: #f6f8fa; }
td code, th code { overflow-wrap: anywhere; }
thead:not(:has(th:not(:empty))) { display: none; }
hr { border: 0; border-top: 1px solid #d1d9e0; margin: 1.5em 0; }
img { max-width: 100%; }
li:has(> input[type=checkbox]) { list-style: none; margin-left: -1.4em; }
.hl-comment { color: #59636e; font-style: italic; }
.hl-string { color: #0a3069; }
.hl-constant { color: #0550ae; }
.hl-keyword, .hl-storage { color: #cf222e; }
.hl-entity.hl-name.hl-function, .hl-support.hl-function { color: #8250df; }
.hl-entity.hl-name.hl-type, .hl-support.hl-type { color: #953800; }
.hl-entity.hl-name.hl-tag { color: #116329; }
@media print { main { padding: 0; } pre, table, blockquote { break-inside: avoid; } }
"#;

fn escape(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

pub fn render(md: &str, title: &str) -> String {
    format!(
        "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n\
         <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n\
         <meta name=\"generator\" content=\"MDForge\">\n<title>{}</title>\n<style>{}</style>\n\
         </head>\n<body>\n<main>\n{}</main>\n</body>\n</html>\n",
        escape(title),
        STYLE,
        markdown::render_html(md)
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn escapes_the_title() {
        let html = render("text", "<b>&\"x\"");
        assert!(html.contains("<title>&lt;b&gt;&amp;&quot;x&quot;</title>"));
    }
}
