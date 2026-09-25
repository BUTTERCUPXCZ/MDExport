//! PDF export via an embedded Typst compiler (offline, no external tools).
//!
//! The comrak AST is translated into Typst *code*: every piece of document text
//! becomes an escaped string literal, so Markdown content can never inject
//! Typst markup or scripting. The Typst "world" has no file access at all.

use std::collections::HashMap;
use std::sync::LazyLock;

use comrak::nodes::{ListType, NodeValue, TableAlignment};
use comrak::Node;
use typst::diag::{FileError, FileResult};
use typst::foundations::{Bytes, Datetime};
use typst::syntax::{FileId, Source};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, LibraryExt, World};
use typst_layout::PagedDocument;

use super::plain_text;
use crate::models::error::{AppError, AppResult};

/// Page, typography and element styles. Uses fonts bundled with typst-assets.
const PREAMBLE: &str = r##"
#set page(paper: "a4", margin: (x: 2.3cm, y: 2.5cm), numbering: "1 / 1", number-align: center)
#set text(font: ("Libertinus Serif", "New Computer Modern"), size: 11pt, lang: "en")
#set par(justify: true, leading: 0.62em, spacing: 1.1em)
#show heading: set block(above: 1.5em, below: 0.75em)
#show heading.where(level: 1): set text(size: 22pt)
#show heading.where(level: 2): it => { set text(size: 15pt); it; v(-0.45em); line(length: 100%, stroke: 0.4pt + luma(190)) }
#show heading.where(level: 3): set text(size: 12.5pt)
#show raw: set text(font: "DejaVu Sans Mono", size: 8.8pt)
#show raw.where(block: false): box.with(fill: luma(243), inset: (x: 3pt), outset: (y: 3pt), radius: 2pt)
#show raw.where(block: true): block.with(fill: luma(246), stroke: 0.5pt + luma(215), inset: 9pt, radius: 3pt, width: 100%)
#show link: set text(fill: rgb("#1a5fb4"))
#show link: underline
#show quote.where(block: true): it => block(stroke: (left: 2pt + luma(170)), inset: (left: 10pt, y: 3pt), text(fill: luma(70), style: "italic", it.body))
#set table(stroke: (_, y) => (bottom: if y == 0 { 0.8pt } else { 0.4pt + luma(200) }), inset: (x: 6pt, y: 5pt))
#show table.cell.where(y: 0): strong
#set list(indent: 0.6em)
#set enum(indent: 0.6em)
#let checkbox(checked) = box(width: 0.75em, height: 0.75em, stroke: 0.6pt + luma(60), baseline: 0.08em, if checked { align(center + horizon, square(size: 0.42em, fill: luma(40))) })
"##;

struct Fonts {
    book: LazyHash<FontBook>,
    fonts: Vec<Font>,
}

static FONTS: LazyLock<Fonts> = LazyLock::new(|| {
    let fonts: Vec<Font> = typst_assets::fonts()
        .flat_map(|data| Font::iter(Bytes::new(data)))
        .collect();
    Fonts {
        book: LazyHash::new(FontBook::from_fonts(&fonts)),
        fonts,
    }
});

static LIBRARY: LazyLock<LazyHash<Library>> =
    LazyLock::new(|| LazyHash::new(<Library as LibraryExt>::default()));

/// A single-file Typst world: the generated source, bundled fonts, no file access.
struct DocumentWorld {
    source: Source,
}

impl World for DocumentWorld {
    fn library(&self) -> &LazyHash<Library> {
        &LIBRARY
    }

    fn book(&self) -> &LazyHash<FontBook> {
        &FONTS.book
    }

    fn main(&self) -> FileId {
        self.source.id()
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        if id == self.source.id() {
            Ok(self.source.clone())
        } else {
            Err(FileError::AccessDenied)
        }
    }

    fn file(&self, _id: FileId) -> FileResult<Bytes> {
        Err(FileError::AccessDenied)
    }

    fn font(&self, index: usize) -> Option<Font> {
        FONTS.fonts.get(index).cloned()
    }

    fn today(&self, _offset: Option<typst::foundations::Duration>) -> Option<Datetime> {
        None
    }
}

/// A Typst string literal. The only way document text enters the generated code.
fn lit(text: &str) -> String {
    let mut out = String::with_capacity(text.len() + 2);
    out.push('"');
    for ch in text.chars() {
        match ch {
            '\\' => out.push_str("\\\\"),
            '"' => out.push_str("\\\""),
            '\n' => out.push_str("\\n"),
            '\t' => out.push_str("\\t"),
            '\r' => {}
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

/// Joins content expressions: `(a + b)`, or `[]` when empty.
fn join(parts: Vec<String>) -> String {
    match parts.len() {
        0 => "[]".to_string(),
        1 => parts.into_iter().next().unwrap_or_default(),
        _ => format!("({})", parts.join(" + ")),
    }
}

fn is_external(url: &str) -> bool {
    let lower = url.to_ascii_lowercase();
    lower.starts_with("http://") || lower.starts_with("https://") || lower.starts_with("mailto:")
}

struct Writer<'a> {
    footnotes: HashMap<String, Node<'a>>,
}

impl<'a> Writer<'a> {
    fn new(root: Node<'a>) -> Self {
        let footnotes = root
            .descendants()
            .filter_map(|node| match &node.data.borrow().value {
                NodeValue::FootnoteDefinition(def) => Some((def.name.clone(), node)),
                _ => None,
            })
            .collect();
        Self { footnotes }
    }

    fn blocks(&self, parent: Node<'a>) -> String {
        join(parent.children().filter_map(|n| self.block(n)).collect())
    }

    fn inlines(&self, parent: Node<'a>) -> String {
        join(parent.children().filter_map(|n| self.inline(n)).collect())
    }

    fn list_item(&self, item: Node<'a>, checked: Option<bool>) -> String {
        let Some(checked) = checked else {
            return self.blocks(item);
        };
        let mark = format!("checkbox({checked}) + h(0.45em)");
        let mut parts = Vec::new();
        for (i, child) in item.children().enumerate() {
            let is_paragraph = matches!(child.data.borrow().value, NodeValue::Paragraph);
            if i == 0 && is_paragraph {
                parts.push(format!("par({mark} + {})", self.inlines(child)));
            } else if let Some(block) = self.block(child) {
                parts.push(block);
            }
        }
        if parts.is_empty() {
            parts.push(format!("par({mark})"));
        }
        join(parts)
    }

    fn block(&self, node: Node<'a>) -> Option<String> {
        let value = node.data.borrow().value.clone();
        Some(match value {
            NodeValue::Paragraph => format!("par({})", self.inlines(node)),
            NodeValue::Heading(h) => format!("heading(level: {}, {})", h.level, self.inlines(node)),
            NodeValue::CodeBlock(code) => {
                let lang = code.info.split_whitespace().next().unwrap_or("");
                let body = code.literal.strip_suffix('\n').unwrap_or(&code.literal);
                if lang.is_empty() {
                    format!("raw({}, block: true)", lit(body))
                } else {
                    format!("raw({}, block: true, lang: {})", lit(body), lit(lang))
                }
            }
            NodeValue::BlockQuote | NodeValue::MultilineBlockQuote(_) | NodeValue::Alert(_) => {
                format!("quote(block: true, {})", self.blocks(node))
            }
            NodeValue::List(list) => {
                let mut all_tasks = true;
                let items: Vec<String> = node
                    .children()
                    .map(|item| {
                        let checked = match &item.data.borrow().value {
                            NodeValue::TaskItem(task) => Some(task.symbol.is_some()),
                            _ => None,
                        };
                        all_tasks &= checked.is_some();
                        self.list_item(item, checked)
                    })
                    .collect();
                let tight = list.tight;
                // Checklists show only the checkbox, like GitHub.
                let marker = if all_tasks { "marker: [], " } else { "" };
                match list.list_type {
                    ListType::Bullet => {
                        format!("list(tight: {tight}, {marker}{})", items.join(", "))
                    }
                    ListType::Ordered => format!(
                        "enum(tight: {tight}, start: {}, {})",
                        list.start,
                        items.join(", ")
                    ),
                }
            }
            NodeValue::Table(table) => {
                let align: Vec<&str> = table
                    .alignments
                    .iter()
                    .map(|a| match a {
                        TableAlignment::Center => "center",
                        TableAlignment::Right => "right",
                        _ => "left",
                    })
                    .collect();
                let mut cells = Vec::new();
                for row in node.children() {
                    let header = matches!(row.data.borrow().value, NodeValue::TableRow(true));
                    let row_cells: Vec<String> = row.children().map(|c| self.inlines(c)).collect();
                    if header {
                        cells.push(format!("table.header({})", row_cells.join(", ")));
                    } else {
                        cells.extend(row_cells);
                    }
                }
                format!(
                    "table(columns: {}, align: ({},), {})",
                    table.num_columns.max(1),
                    align.join(", "),
                    cells.join(", ")
                )
            }
            NodeValue::ThematicBreak => "line(length: 100%, stroke: 0.5pt + luma(200))".into(),
            // Raw HTML is dropped (as in the preview); footnotes are placed inline.
            NodeValue::HtmlBlock(_) | NodeValue::FootnoteDefinition(_) => return None,
            _ => self.blocks(node),
        })
    }

    fn inline(&self, node: Node<'a>) -> Option<String> {
        let value = node.data.borrow().value.clone();
        Some(match value {
            NodeValue::Text(text) => lit(&text),
            NodeValue::SoftBreak => lit(" "),
            NodeValue::LineBreak => "linebreak()".into(),
            NodeValue::Code(code) => format!("raw({})", lit(&code.literal)),
            NodeValue::Emph => format!("emph({})", self.inlines(node)),
            NodeValue::Strong => format!("strong({})", self.inlines(node)),
            NodeValue::Strikethrough => format!("strike({})", self.inlines(node)),
            NodeValue::Link(link) if is_external(&link.url) => {
                format!("link({}, {})", lit(&link.url), self.inlines(node))
            }
            NodeValue::Image(_) => {
                let alt = plain_text(node);
                let label = if alt.is_empty() {
                    "[Image]".to_string()
                } else {
                    format!("[Image: {alt}]")
                };
                format!("emph({})", lit(&label))
            }
            NodeValue::FootnoteReference(reference) => match self.footnotes.get(&reference.name) {
                // A one-paragraph note flows inline after its number.
                Some(def) if def.children().count() == 1 => {
                    let only = def.first_child().expect("one child");
                    if matches!(only.data.borrow().value, NodeValue::Paragraph) {
                        format!("footnote({})", self.inlines(only))
                    } else {
                        format!("footnote({})", self.blocks(def))
                    }
                }
                Some(def) => format!("footnote({})", self.blocks(def)),
                None => format!("super({})", lit(&reference.name)),
            },
            NodeValue::HtmlInline(_) => return None,
            _ => self.inlines(node),
        })
    }
}

/// Builds the complete Typst source for a document.
fn typst_source(root: Node<'_>, title: &str) -> String {
    let writer = Writer::new(root);
    let mut source = format!("#set document(title: {})\n{PREAMBLE}\n", lit(title));
    for node in root.children() {
        if let Some(block) = writer.block(node) {
            source.push_str("#(");
            source.push_str(&block);
            source.push_str(")\n\n");
        }
    }
    source
}

pub fn render(root: Node<'_>, title: &str) -> AppResult<Vec<u8>> {
    let world = DocumentWorld {
        source: Source::detached(typst_source(root, title)),
    };
    let document = typst::compile::<PagedDocument>(&world)
        .output
        .map_err(|errors| {
            let messages: Vec<&str> = errors.iter().map(|e| e.message.as_str()).collect();
            AppError::Io(format!("PDF export failed: {}", messages.join("; ")))
        })?;
    typst_pdf::pdf(&document, &typst_pdf::PdfOptions::default()).map_err(|errors| {
        let messages: Vec<&str> = errors.iter().map(|e| e.message.as_str()).collect();
        AppError::Io(format!("PDF export failed: {}", messages.join("; ")))
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::markdown;

    fn source(md: &str) -> String {
        markdown::with_ast(md, |root| typst_source(root, "T"))
    }

    #[test]
    fn document_text_only_appears_inside_string_literals() {
        let src = source("# Hi #set page(width: 1cm) $x$ \"q\" \\ @ref");
        assert!(
            src.contains(r#"heading(level: 1, "Hi #set page(width: 1cm) $x$ \"q\" \\ @ref")"#),
            "{src}"
        );
        // Inline HTML is dropped, as in the preview.
        assert!(!source("a <b>tag</b>").contains("<b>"));
    }

    #[test]
    fn escapes_string_literals() {
        assert_eq!(lit("a\"b\\c\nd"), r#""a\"b\\c\nd""#);
    }

    #[test]
    fn maps_structure() {
        let src = source("- [x] done\n- [ ] todo\n\n3. three\n\n```rust\nfn a() {}\n```\n\n[x](javascript:alert(1)) [y](https://y.dev)");
        assert!(src.contains("checkbox(true)"));
        assert!(src.contains("checkbox(false)"));
        assert!(src.contains("enum(tight: true, start: 3,"));
        assert!(src.contains(r#"raw("fn a() {}", block: true, lang: "rust")"#));
        assert!(src.contains(r#"link("https://y.dev", "y")"#));
        assert!(!src.contains("javascript"), "{src}");
    }

    #[test]
    fn footnotes_are_placed_inline() {
        let src = source("Text[^n].\n\n[^n]: The note.");
        assert!(src.contains(r#"footnote("The note.")"#), "{src}");
    }
}
