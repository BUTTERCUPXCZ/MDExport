//! Markdown → HTML rendering. The single Markdown parser for MDForge (comrak, GFM).
//!
//! Security: document content is untrusted. Raw HTML is never passed through
//! (`render.unsafe = false`), and comrak drops dangerous URLs such as
//! `javascript:` links. Do not enable `unsafe` without adding sanitization.

use std::sync::LazyLock;

use comrak::options::Plugins;
use comrak::plugins::syntect::{SyntectAdapter, SyntectAdapterBuilder};
use comrak::{markdown_to_html_with_plugins, Options};

/// Prefix for syntax-highlighting CSS classes (e.g. `hl-keyword`), styled in the frontend.
pub const HIGHLIGHT_CLASS_PREFIX: &str = "hl-";

static HIGHLIGHTER: LazyLock<SyntectAdapter> = LazyLock::new(|| {
    SyntectAdapterBuilder::new()
        .css_with_class_prefix(HIGHLIGHT_CLASS_PREFIX)
        .build()
});

/// Parser options shared by the preview and every export format.
pub(crate) fn options() -> Options<'static> {
    let mut options = Options::default();

    // GitHub Flavored Markdown
    options.extension.strikethrough = true;
    options.extension.table = true;
    options.extension.autolink = true;
    options.extension.tasklist = true;
    options.extension.footnotes = true;
    options.extension.header_id_prefix = Some(String::new());

    options.render.r#unsafe = false;

    options
}

/// Parses Markdown into comrak's AST and hands the root node to `f`.
/// The AST is the document representation shared by the PDF and DOCX exporters.
pub(crate) fn with_ast<R>(markdown: &str, f: impl for<'a> FnOnce(comrak::Node<'a>) -> R) -> R {
    let arena = comrak::Arena::new();
    let root = comrak::parse_document(&arena, markdown, &options());
    f(root)
}

/// Renders Markdown to an HTML fragment for the preview.
pub fn render_html(markdown: &str) -> String {
    let mut plugins = Plugins::default();
    plugins.render.codefence_syntax_highlighter = Some(&*HIGHLIGHTER);

    markdown_to_html_with_plugins(markdown, &options(), &plugins)
}

#[cfg(test)]
mod tests {
    use super::render_html;

    #[test]
    fn renders_headings_with_ids() {
        let html = render_html("# Bug Fix\n\n## Root Cause");
        assert!(html.contains(r#"<h1 id="bug-fix">"#), "{html}");
        assert!(html.contains(r#"<h2 id="root-cause">"#), "{html}");
        assert!(html.contains(r##"href="#bug-fix""##), "{html}");
    }

    #[test]
    fn renders_inline_formatting() {
        let html = render_html("**bold** _italic_ ~~gone~~ `code`");
        assert!(html.contains("<strong>bold</strong>"));
        assert!(html.contains("<em>italic</em>"));
        assert!(html.contains("<del>gone</del>"));
        assert!(html.contains("<code>code</code>"));
    }

    #[test]
    fn renders_lists_and_task_lists() {
        let html = render_html("- one\n- two\n\n1. first\n\n- [ ] todo\n- [x] done");
        assert!(html.contains("<ul>"));
        assert!(html.contains("<ol>"));
        assert!(
            html.contains(r#"<input type="checkbox" disabled="" /> todo"#),
            "{html}"
        );
        assert!(
            html.contains(r#"<input type="checkbox" checked="" disabled="" /> done"#),
            "{html}"
        );
    }

    #[test]
    fn renders_tables() {
        let html = render_html("| a | b |\n|---|---|\n| 1 | 2 |");
        assert!(html.contains("<table>"));
        assert!(html.contains("<th>a</th>"));
        assert!(html.contains("<td>2</td>"));
    }

    #[test]
    fn renders_links_images_quotes_and_rules() {
        let html = render_html(
            "[site](https://example.com) https://auto.link\n\n![alt](img.png)\n\n> quote\n\n---",
        );
        assert!(html.contains(r#"<a href="https://example.com">site</a>"#));
        assert!(html.contains(r#"<a href="https://auto.link">"#));
        assert!(html.contains(r#"<img src="img.png" alt="alt" />"#));
        assert!(html.contains("<blockquote>"));
        assert!(html.contains("<hr />"));
    }

    #[test]
    fn highlights_fenced_code_with_css_classes() {
        let html = render_html("```rust\nfn main() {}\n```");
        assert!(
            html.contains(r#"<pre class="syntax-highlighting">"#),
            "{html}"
        );
        assert!(html.contains(r#"class="hl-storage hl-type"#), "{html}");
        assert!(
            html.contains(r#"class="hl-entity hl-name hl-function"#),
            "{html}"
        );
        assert!(
            !html.contains("style="),
            "must use classes, not inline colors: {html}"
        );
    }

    #[test]
    fn unknown_code_language_falls_back_to_plain_text() {
        let html = render_html("```not-a-language\n<b>x</b>\n```");
        assert!(html.contains("&lt;b&gt;x&lt;/b&gt;"), "{html}");
    }

    #[test]
    fn omits_raw_html() {
        let html = render_html("<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>");
        assert!(!html.contains("<script"), "{html}");
        assert!(!html.contains("onerror"), "{html}");
    }

    #[test]
    fn drops_dangerous_link_urls() {
        let html = render_html("[x](javascript:alert(1)) [y](vbscript:foo)");
        assert!(!html.contains("javascript:"), "{html}");
        assert!(!html.contains("vbscript:"), "{html}");
    }

    #[test]
    fn empty_input_renders_empty_output() {
        assert_eq!(render_html(""), "");
    }
}
