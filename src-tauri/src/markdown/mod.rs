//! Markdown → HTML rendering. The single Markdown parser for MDExport (comrak, GFM).
//!
//! Security: document content is untrusted. Raw HTML is never passed through
//! (`render.unsafe = false`), and comrak drops dangerous URLs such as
//! `javascript:` links. Do not enable `unsafe` without adding sanitization.

mod pandoc_tables;

use std::sync::LazyLock;

use comrak::nodes::NodeValue;
use comrak::options::Plugins;
use comrak::plugins::syntect::{SyntectAdapter, SyntectAdapterBuilder};
use comrak::{format_html_with_plugins, Arena, Node, Options};

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
    // Typographic dashes and quotes: `---` → —, `--` → –, "…" → “…” (Pandoc writes dashes this way).
    options.parse.smart = true;

    options.render.r#unsafe = false;

    options
}

/// Parses Markdown the same way for the preview and every export: Pandoc tables
/// become real tables, and rules right before a heading are dropped.
fn parse<'a>(arena: &'a Arena<'a>, markdown: &str, options: &Options) -> Node<'a> {
    let markdown = pandoc_tables::to_pipe_tables(markdown);
    let root = comrak::parse_document(arena, &markdown, options);
    drop_rules_before_headings(root);
    root
}

/// Removes `---` rules directly followed by a heading. Pandoc puts one before every
/// section; the heading already marks the break, so the extra line is just noise.
fn drop_rules_before_headings(root: Node<'_>) {
    let rules: Vec<Node<'_>> = root
        .descendants()
        .filter(|node| matches!(node.data.borrow().value, NodeValue::ThematicBreak))
        .filter(|node| {
            node.next_sibling()
                .is_some_and(|next| matches!(next.data.borrow().value, NodeValue::Heading(_)))
        })
        .collect();
    for rule in rules {
        rule.detach();
    }
}

/// Parses Markdown into comrak's AST and hands the root node to `f`.
/// The AST is the document representation shared by the PDF and DOCX exporters.
pub(crate) fn with_ast<R>(markdown: &str, f: impl for<'a> FnOnce(Node<'a>) -> R) -> R {
    let arena = Arena::new();
    f(parse(&arena, markdown, &options()))
}

/// Renders Markdown to an HTML fragment (used by the HTML export).
pub fn render_html(markdown: &str) -> String {
    render_with(markdown, options())
}

/// Renders Markdown for the live preview. Block elements carry
/// `data-sourcepos="line:col-line:col"` so the preview can follow the editor's scroll.
pub fn render_preview_html(markdown: &str) -> String {
    let mut options = options();
    options.render.sourcepos = true;
    render_with(markdown, options)
}

fn render_with(markdown: &str, options: Options) -> String {
    let mut plugins = Plugins::default();
    plugins.render.codefence_syntax_highlighter = Some(&*HIGHLIGHTER);

    let arena = Arena::new();
    let root = parse(&arena, markdown, &options);
    let mut html = String::new();
    // Writing into a String can't fail.
    let _ = format_html_with_plugins(root, &options, &mut html, &plugins);
    html
}

#[cfg(test)]
mod tests {
    use super::{render_html, render_preview_html};

    #[test]
    fn preview_marks_source_lines_but_exports_do_not() {
        let md = "# Title\n\nFirst paragraph.\n\n- item";
        let preview = render_preview_html(md);
        assert!(preview.contains(r#"data-sourcepos="1:1-1:7""#), "{preview}");
        assert!(
            preview.contains(r#"data-sourcepos="3:1-3:16""#),
            "{preview}"
        );
        assert!(!render_html(md).contains("data-sourcepos"));
    }

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
    fn renders_pandoc_tables_as_tables_without_shifting_lines() {
        let md = "  Field   Type\n  ------- ------\n  id      UUID\n\nAfter the table.";
        let preview = render_preview_html(md);
        assert!(preview.contains("<table"), "{preview}");
        assert!(preview.contains(">UUID</td>"), "{preview}");
        assert!(!preview.contains("<hr"), "{preview}");
        // "After the table." is still on line 5 of the source, for scroll sync.
        assert!(
            preview.contains(r#"<p data-sourcepos="5:1-5:16">After the table.</p>"#),
            "{preview}"
        );
    }

    #[test]
    fn uses_typographic_dashes_outside_code() {
        let html = render_html("Phase 3 --- SOLID, 1--2 `a --- b`");
        assert!(html.contains("Phase 3 — SOLID, 1–2"), "{html}");
        assert!(html.contains("<code>a --- b</code>"), "{html}");
    }

    #[test]
    fn drops_rules_right_before_headings_only() {
        let html = render_html("Intro.\n\n---\n\n# Section\n\nText.\n\n---\n\nMore.");
        assert_eq!(html.matches("<hr").count(), 1, "{html}");
        assert!(
            html.find("<hr").unwrap() > html.find("Text.").unwrap(),
            "{html}"
        );
        // Line numbers of what follows are unchanged (scroll sync).
        let preview = render_preview_html("A\n\n---\n\n# B");
        assert!(
            preview.contains(r#"data-sourcepos="5:1-5:3""#) && !preview.contains("<hr"),
            "{preview}"
        );
    }

    #[test]
    fn empty_input_renders_empty_output() {
        assert_eq!(render_html(""), "");
    }
}
