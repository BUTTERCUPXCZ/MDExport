//! DOCX export with real Word styles (Heading 1–6, Code, Quote), numbered and
//! bulleted lists, tables, links and page numbers.
//!
//! Uses the same "modern document" look as the PDF (`pdf.rs`) and the preview:
//! sans-serif, left-aligned, dark-blue section headings, shaded table headers,
//! code boxes and callout quotes — the style of ChatGPT / Claude documents.

use std::collections::HashMap;
use std::io::Cursor;

use comrak::nodes::{ListType, NodeValue, TableAlignment};
use comrak::Node;
use docx_rs::{
    AbstractNumbering, AlignmentType, BorderType, BreakType, Docx, Footer, Hyperlink,
    HyperlinkType, IndentLevel, Level, LevelJc, LevelOverride, LevelText, LineSpacing,
    LineSpacingType, NumberFormat, Numbering, NumberingId, PageMargin, PageNum, Paragraph,
    ParagraphBorder, ParagraphBorderPosition, Run, RunFonts, Shading, ShdType, SpecialIndentType,
    Start, Style, StyleType, Table, TableBorder, TableBorderPosition, TableBorders, TableCell,
    TableCellMargins, TableRow, WidthType,
};

use super::plain_text;
use crate::models::error::{AppError, AppResult};

const BODY_FONT: &str = "Calibri";
const MONO_FONT: &str = "Consolas";
const INK: &str = "1F2328";
const ACCENT: &str = "1F3A5F";
const LINK_COLOR: &str = "0969DA";
const RULE: &str = "D0D7DE";
const CODE_FILL: &str = "F6F8FA";
const INLINE_CODE_FILL: &str = "EFF1F3";
const QUOTE_FILL: &str = "F3F6FA";
const HEADER_FILL: &str = "F0F3F6";
const BULLET_ABSTRACT: usize = 1;
const DECIMAL_ABSTRACT: usize = 2;

/// Heading sizes in half-points, for levels 1–6 (22pt title, 15pt sections…).
const HEADING_SIZES: [usize; 6] = [44, 30, 25, 22, 21, 21];

fn fonts(name: &str) -> RunFonts {
    RunFonts::new()
        .ascii(name)
        .hi_ansi(name)
        .cs(name)
        .east_asia(name)
}

fn styles(docx: Docx) -> Docx {
    let mut docx = docx;
    for (i, size) in HEADING_SIZES.iter().enumerate() {
        let level = i + 1;
        docx = docx.add_style(
            Style::new(format!("Heading{level}"), StyleType::Paragraph)
                .name(format!("heading {level}"))
                .based_on("Normal")
                .next("Normal")
                .size(*size)
                .bold()
                .color(if level == 2 { ACCENT } else { INK })
                .outline_lvl(i)
                .line_spacing(
                    LineSpacing::new()
                        .before(match level {
                            1 => 0,
                            2 => 400,
                            _ => 280,
                        })
                        .after(if level == 1 { 240 } else { 120 }),
                ),
        );
    }

    // Code blocks: one paragraph per line in a light box (shading + border).
    let mut code = Style::new("Code", StyleType::Paragraph)
        .name("Code")
        .based_on("Normal")
        .fonts(fonts(MONO_FONT))
        .size(18)
        .color(INK)
        .indent(Some(120), None, Some(120), None)
        .line_spacing(LineSpacing::new().before(0).after(0).line(240));
    code.paragraph_property = code
        .paragraph_property
        .shading(Shading::new().shd_type(ShdType::Clear).fill(CODE_FILL));
    for position in [
        ParagraphBorderPosition::Top,
        ParagraphBorderPosition::Bottom,
        ParagraphBorderPosition::Left,
        ParagraphBorderPosition::Right,
    ] {
        code.paragraph_property = code.paragraph_property.set_border(
            ParagraphBorder::new(position)
                .val(BorderType::Single)
                .size(4)
                .space(4)
                .color(RULE),
        );
    }

    // Quotes render as a tinted callout with a blue bar, like AI-generated notes.
    let mut quote = Style::new("Quote", StyleType::Paragraph)
        .name("Quote")
        .based_on("Normal")
        .color(INK)
        .indent(Some(200), None, Some(120), None);
    quote.paragraph_property = quote
        .paragraph_property
        .shading(Shading::new().shd_type(ShdType::Clear).fill(QUOTE_FILL))
        .set_border(
            ParagraphBorder::new(ParagraphBorderPosition::Left)
                .val(BorderType::Single)
                .size(24)
                .space(8)
                .color(LINK_COLOR),
        );

    docx.add_style(code).add_style(quote)
}

fn list_level(level: usize, format: &str, text: String) -> Level {
    let indent = 720 * (level as i32 + 1);
    Level::new(
        level,
        Start::new(1),
        NumberFormat::new(format),
        LevelText::new(text),
        LevelJc::new("left"),
    )
    .indent(
        Some(indent),
        Some(SpecialIndentType::Hanging(360)),
        None,
        None,
    )
}

fn numbering_definitions(docx: Docx) -> Docx {
    let bullets = ["•", "◦", "▪"];
    let mut bullet = AbstractNumbering::new(BULLET_ABSTRACT);
    let mut decimal = AbstractNumbering::new(DECIMAL_ABSTRACT);
    for level in 0..9 {
        bullet = bullet.add_level(list_level(level, "bullet", bullets[level % 3].to_string()));
        decimal = decimal.add_level(list_level(level, "decimal", format!("%{}.", level + 1)));
    }
    docx.add_abstract_numbering(bullet)
        .add_abstract_numbering(decimal)
}

#[derive(Clone, Copy, Default)]
struct Format {
    bold: bool,
    italic: bool,
    strike: bool,
    code: bool,
    link: bool,
}

enum Piece {
    Run(Box<Run>),
    Link(String, Vec<Run>),
}

enum Block {
    Paragraph(Box<Paragraph>),
    Table(Box<Table>),
}

fn piece(run: Run) -> Piece {
    Piece::Run(Box::new(run))
}

fn para(p: Paragraph) -> Block {
    Block::Paragraph(Box::new(p))
}

struct Writer<'a> {
    footnotes: HashMap<String, Node<'a>>,
    footnote_numbers: HashMap<String, usize>,
    numberings: Vec<Numbering>,
    blocks: Vec<Block>,
}

impl<'a> Writer<'a> {
    fn run(text: &str, fmt: Format) -> Run {
        let mut run = Run::new().add_text(text);
        if fmt.bold {
            run = run.bold();
        }
        if fmt.italic {
            run = run.italic();
        }
        if fmt.strike {
            run = run.strike();
        }
        if fmt.code {
            run = run.fonts(fonts(MONO_FONT)).size(19).shading(
                Shading::new()
                    .shd_type(ShdType::Clear)
                    .fill(INLINE_CODE_FILL),
            );
        }
        if fmt.link {
            run = run.color(LINK_COLOR);
        }
        run
    }

    fn inlines(&mut self, parent: Node<'a>, fmt: Format, out: &mut Vec<Piece>) {
        for node in parent.children() {
            self.inline(node, fmt, out);
        }
    }

    fn inline(&mut self, node: Node<'a>, fmt: Format, out: &mut Vec<Piece>) {
        let value = node.data.borrow().value.clone();
        match value {
            NodeValue::Text(text) => out.push(piece(Self::run(&text, fmt))),
            NodeValue::SoftBreak => out.push(piece(Self::run(" ", fmt))),
            NodeValue::LineBreak => out.push(piece(Run::new().add_break(BreakType::TextWrapping))),
            NodeValue::Code(code) => out.push(piece(Self::run(
                &code.literal,
                Format { code: true, ..fmt },
            ))),
            NodeValue::Emph => self.inlines(
                node,
                Format {
                    italic: true,
                    ..fmt
                },
                out,
            ),
            NodeValue::Strong => self.inlines(node, Format { bold: true, ..fmt }, out),
            NodeValue::Strikethrough => self.inlines(
                node,
                Format {
                    strike: true,
                    ..fmt
                },
                out,
            ),
            NodeValue::Link(link) => {
                let url = link.url.to_ascii_lowercase();
                let external = url.starts_with("http://")
                    || url.starts_with("https://")
                    || url.starts_with("mailto:");
                if external {
                    let mut inner = Vec::new();
                    self.inlines(node, Format { link: true, ..fmt }, &mut inner);
                    let runs = inner
                        .into_iter()
                        .filter_map(|p| match p {
                            Piece::Run(r) => Some(*r),
                            Piece::Link(_, _) => None,
                        })
                        .collect();
                    out.push(Piece::Link(link.url.clone(), runs));
                } else {
                    self.inlines(node, fmt, out);
                }
            }
            NodeValue::Image(_) => {
                let alt = plain_text(node);
                let label = if alt.is_empty() {
                    "[Image]".into()
                } else {
                    format!("[Image: {alt}]")
                };
                out.push(piece(Self::run(
                    &label,
                    Format {
                        italic: true,
                        ..fmt
                    },
                )));
            }
            NodeValue::FootnoteReference(reference) => {
                let next = self.footnote_numbers.len() + 1;
                let n = *self.footnote_numbers.entry(reference.name).or_insert(next);
                out.push(piece(Self::run(&format!("[{n}]"), fmt).size(16)));
            }
            NodeValue::HtmlInline(_) => {}
            _ => self.inlines(node, fmt, out),
        }
    }

    fn paragraph(pieces: Vec<Piece>, mut p: Paragraph) -> Paragraph {
        for piece in pieces {
            p = match piece {
                Piece::Run(run) => p.add_run(*run),
                Piece::Link(url, runs) => {
                    let link = runs
                        .into_iter()
                        .fold(Hyperlink::new(url, HyperlinkType::External), |l, r| {
                            l.add_run(r)
                        });
                    p.add_hyperlink(link)
                }
            };
        }
        p
    }

    fn inline_paragraph(&mut self, node: Node<'a>, p: Paragraph, fmt: Format) -> Paragraph {
        let mut pieces = Vec::new();
        self.inlines(node, fmt, &mut pieces);
        Self::paragraph(pieces, p)
    }

    fn new_numbering(&mut self, ordered: bool, start: usize) -> usize {
        let id = self.numberings.len() + 1;
        let abstract_id = if ordered {
            DECIMAL_ABSTRACT
        } else {
            BULLET_ABSTRACT
        };
        let mut numbering = Numbering::new(id, abstract_id);
        if ordered {
            numbering = numbering.add_override(LevelOverride::new(0).start(start));
        }
        self.numberings.push(numbering);
        id
    }

    /// Writes a block. `list` is `(numbering id, depth)` for the first paragraph
    /// of a list item; later paragraphs in the item are indented without a number.
    fn block(&mut self, node: Node<'a>, list: Option<(usize, usize)>, indent_depth: Option<usize>) {
        let value = node.data.borrow().value.clone();
        match value {
            NodeValue::Paragraph => {
                let mut p = Paragraph::new();
                if let Some((id, depth)) = list {
                    p = p.numbering(NumberingId::new(id), IndentLevel::new(depth));
                } else if let Some(depth) = indent_depth {
                    p = p.indent(Some(720 * (depth as i32 + 1)), None, None, None);
                }
                let p = self.inline_paragraph(node, p, Format::default());
                self.blocks.push(para(p));
            }
            NodeValue::Heading(h) => {
                let p = Paragraph::new().style(&format!("Heading{}", h.level.clamp(1, 6)));
                let p = self.inline_paragraph(node, p, Format::default());
                self.blocks.push(para(p));
            }
            NodeValue::CodeBlock(code) => {
                let body = code.literal.strip_suffix('\n').unwrap_or(&code.literal);
                for line in body.split('\n') {
                    let p = Paragraph::new()
                        .style("Code")
                        .add_run(Run::new().add_text(line));
                    self.blocks.push(para(p));
                }
                // Breathing room after the block.
                self.blocks.push(para(Paragraph::new().size(8)));
            }
            NodeValue::BlockQuote | NodeValue::MultilineBlockQuote(_) | NodeValue::Alert(_) => {
                for child in node.children() {
                    if matches!(child.data.borrow().value, NodeValue::Paragraph) {
                        let p = self.inline_paragraph(
                            child,
                            Paragraph::new().style("Quote"),
                            Format::default(),
                        );
                        self.blocks.push(para(p));
                    } else {
                        self.block(child, None, indent_depth);
                    }
                }
            }
            NodeValue::List(nl) => {
                let depth = indent_depth.map_or(0, |d| d + 1);
                let id = self.new_numbering(nl.list_type == ListType::Ordered, nl.start);
                for item in node.children() {
                    let checked = match &item.data.borrow().value {
                        NodeValue::TaskItem(task) => Some(task.symbol.is_some()),
                        _ => None,
                    };
                    for (i, child) in item.children().enumerate() {
                        let first_paragraph =
                            i == 0 && matches!(child.data.borrow().value, NodeValue::Paragraph);
                        if first_paragraph {
                            let mut p = Paragraph::new()
                                .numbering(NumberingId::new(id), IndentLevel::new(depth));
                            if let Some(checked) = checked {
                                p = p.add_run(Run::new().add_text(if checked {
                                    "☑ "
                                } else {
                                    "☐ "
                                }));
                            }
                            let p = self.inline_paragraph(child, p, Format::default());
                            self.blocks.push(para(p));
                        } else {
                            self.block(child, None, Some(depth));
                        }
                    }
                }
            }
            NodeValue::Table(table) => {
                let aligns = table.alignments.clone();
                let mut rows = Vec::new();
                for row in node.children() {
                    let header = matches!(row.data.borrow().value, NodeValue::TableRow(true));
                    // Skip `| | |` headers instead of emitting an empty shaded row.
                    if header && row.children().all(|c| plain_text(c).trim().is_empty()) {
                        continue;
                    }
                    let cells = row
                        .children()
                        .enumerate()
                        .map(|(i, cell)| {
                            let align = match aligns.get(i) {
                                Some(TableAlignment::Center) => AlignmentType::Center,
                                Some(TableAlignment::Right) => AlignmentType::Right,
                                _ => AlignmentType::Left,
                            };
                            let fmt = Format {
                                bold: header,
                                ..Format::default()
                            };
                            // Tight cell text: no paragraph spacing inside tables.
                            let cell_p = Paragraph::new()
                                .align(align)
                                .size(20)
                                .line_spacing(LineSpacing::new().before(0).after(0));
                            let p = self.inline_paragraph(cell, cell_p, fmt);
                            let mut c = TableCell::new().add_paragraph(p);
                            if header {
                                c = c.shading(
                                    Shading::new().shd_type(ShdType::Clear).fill(HEADER_FILL),
                                );
                            }
                            c
                        })
                        .collect();
                    rows.push(TableRow::new(cells));
                }
                let mut borders = TableBorders::new();
                for position in [
                    TableBorderPosition::Top,
                    TableBorderPosition::Bottom,
                    TableBorderPosition::Left,
                    TableBorderPosition::Right,
                    TableBorderPosition::InsideH,
                    TableBorderPosition::InsideV,
                ] {
                    borders = borders.set(
                        TableBorder::new(position)
                            .border_type(BorderType::Single)
                            .size(4)
                            .color(RULE),
                    );
                }
                let table = Table::new(rows)
                    .width(5000, WidthType::Pct)
                    .set_borders(borders)
                    .margins(TableCellMargins::new().margin(80, 140, 80, 140));
                self.blocks.push(Block::Table(Box::new(table)));
                self.blocks.push(para(Paragraph::new()));
            }
            NodeValue::ThematicBreak => {
                let mut p = Paragraph::new();
                p.property = p.property.set_border(
                    ParagraphBorder::new(ParagraphBorderPosition::Bottom)
                        .val(BorderType::Single)
                        .size(6)
                        .color(RULE),
                );
                self.blocks.push(para(p));
            }
            NodeValue::HtmlBlock(_) | NodeValue::FootnoteDefinition(_) => {}
            _ => {
                for child in node.children() {
                    self.block(child, list, indent_depth);
                }
            }
        }
    }

    /// Footnote definitions as a "Notes" section, numbered in reference order.
    fn notes(&mut self) {
        if self.footnote_numbers.is_empty() {
            return;
        }
        let mut ordered: Vec<(String, usize)> = self.footnote_numbers.clone().into_iter().collect();
        ordered.sort_by_key(|(_, n)| *n);
        self.blocks.push(para(
            Paragraph::new()
                .style("Heading2")
                .add_run(Run::new().add_text("Notes")),
        ));
        for (name, n) in ordered {
            let Some(def) = self.footnotes.get(&name).copied() else {
                continue;
            };
            let mut pieces = vec![piece(Run::new().add_text(format!("[{n}] ")))];
            for child in def.children() {
                self.inlines(child, Format::default(), &mut pieces);
            }
            self.blocks
                .push(para(Self::paragraph(pieces, Paragraph::new().size(18))));
        }
    }
}

/// `_title` is unused: docx-rs has no public setter for the core title property.
pub fn render(root: Node<'_>, _title: &str) -> AppResult<Vec<u8>> {
    let footnotes = root
        .descendants()
        .filter_map(|node| match &node.data.borrow().value {
            NodeValue::FootnoteDefinition(def) => Some((def.name.clone(), node)),
            _ => None,
        })
        .collect();
    let mut writer = Writer {
        footnotes,
        footnote_numbers: HashMap::new(),
        numberings: Vec::new(),
        blocks: Vec::new(),
    };
    for node in root.children() {
        writer.block(node, None, None);
    }
    writer.notes();

    let footer = Footer::new().add_paragraph(
        Paragraph::new()
            .align(AlignmentType::Center)
            .size(17)
            .color("59636E")
            .add_page_num(PageNum::new()),
    );
    let mut docx = Docx::new()
        .default_fonts(fonts(BODY_FONT))
        .default_size(22)
        // 1.15 line spacing, 8pt after paragraphs (Word's modern default look).
        .default_line_spacing(
            LineSpacing::new()
                .line_rule(LineSpacingType::Auto)
                .line(276)
                .after(160),
        )
        .page_size(11906, 16838) // A4
        .page_margin(PageMargin {
            top: 1247,
            left: 1247,
            bottom: 1361,
            right: 1247,
            header: 720,
            footer: 600,
            gutter: 0,
        })
        .footer(footer);
    docx = numbering_definitions(styles(docx));
    for numbering in writer.numberings {
        docx = docx.add_numbering(numbering);
    }
    for block in writer.blocks {
        docx = match block {
            Block::Paragraph(p) => docx.add_paragraph(*p),
            Block::Table(t) => docx.add_table(*t),
        };
    }

    let mut buffer = Cursor::new(Vec::new());
    docx.build()
        .pack(&mut buffer)
        .map_err(|e| AppError::Io(format!("Word export failed: {e}")))?;
    Ok(buffer.into_inner())
}
