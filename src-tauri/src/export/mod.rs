//! Markdown → PDF / DOCX / HTML. Every format starts from the same comrak AST
//! (see `markdown::with_ast`), so exports match the preview.

mod docx;
mod html;
mod pdf;

use comrak::nodes::NodeValue;
use comrak::Node;
use serde::Deserialize;

use crate::markdown;
use crate::models::error::AppResult;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    Pdf,
    Docx,
    Html,
}

impl ExportFormat {
    pub fn extension(self) -> &'static str {
        match self {
            ExportFormat::Pdf => "pdf",
            ExportFormat::Docx => "docx",
            ExportFormat::Html => "html",
        }
    }

    pub fn label(self) -> &'static str {
        match self {
            ExportFormat::Pdf => "PDF document",
            ExportFormat::Docx => "Word document",
            ExportFormat::Html => "HTML page",
        }
    }
}

/// How a PDF is split into pages.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PdfPages {
    /// A4 pages with page numbers, for printing.
    #[default]
    A4,
    /// One long page: nothing is ever cut between pages. For reading on screen.
    Continuous,
}

/// Converts Markdown to the given format (A4 pages for PDF).
#[cfg(test)]
pub fn export(markdown: &str, format: ExportFormat, fallback_title: &str) -> AppResult<Vec<u8>> {
    export_with(markdown, format, fallback_title, PdfPages::A4)
}

/// Converts Markdown to the given format. `fallback_title` is used when the
/// document has no top-level heading (usually the file name); `pages` only
/// affects PDF.
pub fn export_with(
    markdown: &str,
    format: ExportFormat,
    fallback_title: &str,
    pages: PdfPages,
) -> AppResult<Vec<u8>> {
    let title = document_title(markdown).unwrap_or_else(|| fallback_title.to_string());
    match format {
        ExportFormat::Pdf => markdown::with_ast(markdown, |root| pdf::render(root, &title, pages)),
        ExportFormat::Docx => markdown::with_ast(markdown, |root| docx::render(root, &title)),
        ExportFormat::Html => Ok(html::render(markdown, &title).into_bytes()),
    }
}

/// Plain text of a node and its descendants (for titles and image alt text).
pub(crate) fn plain_text(node: Node<'_>) -> String {
    let mut out = String::new();
    for descendant in node.descendants() {
        match &descendant.data.borrow().value {
            NodeValue::Text(text) => out.push_str(text),
            NodeValue::Code(code) => out.push_str(&code.literal),
            NodeValue::SoftBreak | NodeValue::LineBreak => out.push(' '),
            _ => {}
        }
    }
    out
}

/// Text of the first level-1 heading, if any.
fn document_title(markdown: &str) -> Option<String> {
    markdown::with_ast(markdown, |root| {
        root.children()
            .find_map(|node| match node.data.borrow().value {
                NodeValue::Heading(ref h) if h.level == 1 => {
                    Some(plain_text(node)).filter(|t| !t.trim().is_empty())
                }
                _ => None,
            })
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = "# Bug: Progress wrong\n\n## Context\n\nThe **dashboard** showed _wrong_ ~~data~~ with `code` and a [link](https://example.com).\n\n> A quote\n\n- one\n  - nested\n- [x] done\n- [ ] todo\n\n1. first\n2. second\n\n```rust\nfn main() { println!(\"hi \\\"quoted\\\"\"); }\n```\n\n| File | Change |\n|:-----|------:|\n| `a.rs` | fixed |\n\n---\n\nText with a footnote.[^1] Special chars: # $ * _ [ ] < > @ \\ \" '\n\n![screenshot](shot.png)\n\n[^1]: The note.\n";

    #[test]
    fn title_comes_from_first_h1_or_fallback() {
        assert_eq!(
            document_title(SAMPLE).as_deref(),
            Some("Bug: Progress wrong")
        );
        assert_eq!(document_title("## Only h2\n\ntext"), None);
    }

    #[test]
    fn exports_pdf() {
        let bytes = export(SAMPLE, ExportFormat::Pdf, "fallback").unwrap();
        assert!(bytes.starts_with(b"%PDF-"), "not a PDF");
        assert!(bytes.len() > 1_000);
    }

    #[test]
    fn exports_empty_document_to_pdf() {
        let bytes = export("", ExportFormat::Pdf, "Empty").unwrap();
        assert!(bytes.starts_with(b"%PDF-"));
    }

    #[test]
    fn exports_docx_as_zip() {
        let bytes = export(SAMPLE, ExportFormat::Docx, "fallback").unwrap();
        assert!(bytes.starts_with(b"PK"), "not a zip/docx");
    }

    #[test]
    fn exports_standalone_html() {
        let html = String::from_utf8(export(SAMPLE, ExportFormat::Html, "x").unwrap()).unwrap();
        assert!(html.starts_with("<!doctype html>"));
        assert!(html.contains("<title>Bug: Progress wrong</title>"));
        assert!(html.contains("<table>"));
    }

    #[test]
    fn raw_html_never_reaches_exports() {
        let md = "<script>alert(1)</script>\n\n# T";
        let html = String::from_utf8(export(md, ExportFormat::Html, "x").unwrap()).unwrap();
        assert!(!html.contains("<script>alert"));
    }

    /// Writes sample exports for manual inspection:
    /// `MDEXPORT_EXPORT_DIR=/tmp/out [MDEXPORT_EXPORT_INPUT=doc.md] cargo test write_sample_exports -- --ignored`
    #[test]
    #[ignore]
    fn write_sample_exports() {
        let dir = std::env::var("MDEXPORT_EXPORT_DIR").expect("set MDEXPORT_EXPORT_DIR");
        let input = std::env::var("MDEXPORT_EXPORT_INPUT")
            .map(|path| std::fs::read_to_string(path).unwrap())
            .unwrap_or_else(|_| SAMPLE.to_string());
        for format in [ExportFormat::Pdf, ExportFormat::Docx, ExportFormat::Html] {
            let bytes = export(&input, format, "sample").unwrap();
            let path = std::path::Path::new(&dir).join(format!("sample.{}", format.extension()));
            std::fs::write(path, bytes).unwrap();
        }
        let continuous = export_with(&input, ExportFormat::Pdf, "sample", PdfPages::Continuous);
        std::fs::write(
            std::path::Path::new(&dir).join("sample-continuous.pdf"),
            continuous.unwrap(),
        )
        .unwrap();
    }

    #[test]
    fn continuous_pdf_has_one_page_per_section() {
        let long = "Paragraph of text that fills the page.\n\n".repeat(200);
        let a4 = export_with(&long, ExportFormat::Pdf, "x", PdfPages::A4).unwrap();
        let continuous = export_with(&long, ExportFormat::Pdf, "x", PdfPages::Continuous).unwrap();
        assert!(continuous.starts_with(b"%PDF-"));
        assert!(pdf::page_count(&long, PdfPages::A4) > 1);
        assert_eq!(pdf::page_count(&long, PdfPages::Continuous), 1);
        assert_ne!(a4, continuous);

        // A new page per `#` section (none before the first), never in the middle.
        let sections = format!("# One\n\n{long}# Two\n\n{long}## Sub\n\ntext\n\n# Three\n");
        assert_eq!(pdf::page_count(&sections, PdfPages::Continuous), 3);
    }

    #[test]
    fn format_metadata() {
        assert_eq!(ExportFormat::Pdf.extension(), "pdf");
        assert_eq!(ExportFormat::Docx.label(), "Word document");
    }
}
