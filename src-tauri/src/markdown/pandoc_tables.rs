//! Pandoc-style tables → GitHub pipe tables, before comrak parses the document.
//!
//! Documents converted with Pandoc (e.g. from Word) use *simple* and *multiline*
//! tables: columns lined up with spaces and marked by a row of dashes. comrak only
//! knows pipe tables, so without this the dash row becomes a `<hr>` and the cells
//! run together as a paragraph. The file on disk is never changed.
//!
//! Converted tables take up exactly as many lines as the original (padded with blank
//! lines), so `data-sourcepos` line numbers after a table stay right for scroll sync.

use std::borrow::Cow;

/// A column's dash run in the separator line: `start..end` in chars.
type Span = (usize, usize);

#[derive(Clone, Copy, PartialEq, Eq)]
enum Align {
    Default,
    Left,
    Right,
    Center,
}

fn indent(line: &str) -> usize {
    line.chars().take_while(|c| *c == ' ').count()
}

fn is_blank(line: &str) -> bool {
    line.trim().is_empty()
}

/// Dash runs of a separator line (`---- ------ ---`), when it has at least two
/// columns. Every run is at least 3 dashes, so `- - -` rules are not tables.
fn dash_runs(line: &str) -> Option<Vec<Span>> {
    if indent(line) > 3 {
        return None;
    }
    let chars: Vec<char> = line.trim_end().chars().collect();
    if chars.iter().any(|c| *c != '-' && *c != ' ') {
        return None;
    }
    let mut runs = Vec::new();
    let mut i = 0;
    while i < chars.len() {
        if chars[i] == '-' {
            let start = i;
            while i < chars.len() && chars[i] == '-' {
                i += 1;
            }
            runs.push((start, i));
        } else {
            i += 1;
        }
    }
    (runs.len() >= 2 && runs.iter().all(|(s, e)| e - s >= 3)).then_some(runs)
}

/// One unbroken dash line: the top/bottom border of a multiline table (or a plain rule).
fn is_border(line: &str) -> bool {
    let trimmed = line.trim();
    indent(line) <= 3 && trimmed.len() >= 3 && trimmed.chars().all(|c| c == '-')
}

fn is_fence(line: &str) -> Option<(char, usize)> {
    let trimmed = line.trim_start();
    if indent(line) > 3 {
        return None;
    }
    let first = trimmed.chars().next()?;
    if first != '`' && first != '~' {
        return None;
    }
    let count = trimmed.chars().take_while(|c| *c == first).count();
    (count >= 3).then_some((first, count))
}

/// Text of each column in `line`. A column runs from its dash run's start to the
/// next run's start, so text overhanging a run still belongs to its column (as in Pandoc).
fn cells(line: &str, runs: &[Span]) -> Vec<String> {
    let chars: Vec<char> = line.chars().collect();
    runs.iter()
        .enumerate()
        .map(|(i, (start, _))| {
            let from = if i == 0 { 0 } else { *start };
            let to = runs.get(i + 1).map_or(chars.len(), |(next, _)| *next);
            let from = from.min(chars.len());
            let to = to.min(chars.len()).max(from);
            chars[from..to]
                .iter()
                .collect::<String>()
                .trim()
                .to_string()
        })
        .collect()
}

/// Pandoc's alignment rule: where the header text sits relative to its dash run.
fn alignments(line: &str, runs: &[Span]) -> Vec<Align> {
    let chars: Vec<char> = line.chars().collect();
    runs.iter()
        .enumerate()
        .map(|(i, (start, end))| {
            let from = if i == 0 { 0 } else { *start };
            let to = runs.get(i + 1).map_or(chars.len(), |(next, _)| *next);
            let text: Vec<usize> = (from..to.min(chars.len()))
                .filter(|&k| !chars[k].is_whitespace())
                .collect();
            let (Some(&first), Some(&last)) = (text.first(), text.last()) else {
                return Align::Default;
            };
            match (first == *start, last + 1 == *end) {
                (true, false) => Align::Left,
                (false, true) => Align::Right,
                (false, false) => Align::Center,
                (true, true) => Align::Default,
            }
        })
        .collect()
}

fn pipe_row(cells: &[String]) -> String {
    let escaped: Vec<String> = cells.iter().map(|c| c.replace('|', "\\|")).collect();
    format!("| {} |", escaped.join(" | "))
}

fn separator(aligns: &[Align]) -> String {
    let parts: Vec<&str> = aligns
        .iter()
        .map(|a| match a {
            Align::Default => "---",
            Align::Left => ":--",
            Align::Right => "--:",
            Align::Center => ":-:",
        })
        .collect();
    format!("| {} |", parts.join(" | "))
}

/// Joins a multiline row's lines column by column.
fn joined_cells(lines: &[&str], runs: &[Span]) -> Vec<String> {
    let mut out = vec![String::new(); runs.len()];
    for line in lines {
        for (cell, text) in out.iter_mut().zip(cells(line, runs)) {
            if !text.is_empty() {
                if !cell.is_empty() {
                    cell.push(' ');
                }
                cell.push_str(&text);
            }
        }
    }
    out
}

/// Groups lines into rows separated by blank lines.
fn row_groups<'a>(lines: &[&'a str]) -> Vec<Vec<&'a str>> {
    lines
        .split(|l| is_blank(l))
        .filter(|g| !g.is_empty())
        .map(|g| g.to_vec())
        .collect()
}

struct Table {
    /// Lines of the original table (it is replaced by this many lines).
    len: usize,
    header: Vec<String>,
    aligns: Vec<Align>,
    rows: Vec<Vec<String>>,
}

impl Table {
    fn render(&self) -> Vec<String> {
        let mut out = vec![pipe_row(&self.header), separator(&self.aligns)];
        out.extend(self.rows.iter().map(|r| pipe_row(r)));
        out.resize(self.len.max(out.len()), String::new());
        out
    }
}

/// Simple table with a header: header line, dash runs, one line per row until a
/// blank line; an optional closing dash-run line.
fn simple(lines: &[&str], i: usize) -> Option<Table> {
    let header = lines[i];
    if is_blank(header) || is_border(header) || dash_runs(header).is_some() {
        return None;
    }
    let runs = dash_runs(lines.get(i + 1)?)?;
    let mut end = i + 2;
    while end < lines.len() && !is_blank(lines[end]) && dash_runs(lines[end]).is_none() {
        end += 1;
    }
    let rows: Vec<Vec<String>> = lines[i + 2..end].iter().map(|l| cells(l, &runs)).collect();
    if end < lines.len() && dash_runs(lines[end]).is_some() {
        end += 1;
    }
    Some(Table {
        len: end - i,
        header: cells(header, &runs),
        aligns: alignments(header, &runs),
        rows,
    })
}

/// Multiline table: border, header line(s), dash runs, rows separated by blank
/// lines, closing border.
fn multiline(lines: &[&str], i: usize) -> Option<Table> {
    if !is_border(lines[i]) {
        return None;
    }
    let mut j = i + 1;
    while j < lines.len() && !is_blank(lines[j]) && dash_runs(lines[j]).is_none() {
        j += 1;
    }
    if j == i + 1 || j >= lines.len() {
        return None;
    }
    let runs = dash_runs(lines[j])?;
    let close = (j + 1..lines.len()).find(|&k| is_border(lines[k]))?;
    // A heading or fence before the closing border means this isn't one table.
    if lines[j + 1..close]
        .iter()
        .any(|l| l.trim_start().starts_with('#') || is_fence(l).is_some())
    {
        return None;
    }
    let header_lines = &lines[i + 1..j];
    Some(Table {
        len: close - i + 1,
        header: joined_cells(header_lines, &runs),
        aligns: alignments(header_lines[0], &runs),
        rows: row_groups(&lines[j + 1..close])
            .iter()
            .map(|g| joined_cells(g, &runs))
            .collect(),
    })
}

/// Headerless table: dash runs, rows, closing dash runs or border. Rows separated
/// by blank lines are multiline rows. Gets an empty header, which renders hidden.
fn headerless(lines: &[&str], i: usize) -> Option<Table> {
    let runs = dash_runs(lines[i])?;
    let close = (i + 1..lines.len())
        .take_while(|&k| !lines[k].trim_start().starts_with('#') && is_fence(lines[k]).is_none())
        .find(|&k| dash_runs(lines[k]).is_some() || is_border(lines[k]))?;
    let body = &lines[i + 1..close];
    if body.iter().all(|l| is_blank(l)) {
        return None;
    }
    let multi = body.iter().any(|l| is_blank(l));
    let rows = if multi {
        row_groups(body)
            .iter()
            .map(|g| joined_cells(g, &runs))
            .collect()
    } else {
        body.iter().map(|l| cells(l, &runs)).collect()
    };
    let first = body.iter().find(|l| !is_blank(l)).copied().unwrap_or("");
    Some(Table {
        len: close - i + 1,
        header: vec![String::new(); runs.len()],
        aligns: alignments(first, &runs),
        rows,
    })
}

/// Rewrites Pandoc simple and multiline tables as pipe tables. Returns the input
/// unchanged (borrowed) when it has none.
pub fn to_pipe_tables(markdown: &str) -> Cow<'_, str> {
    let lines: Vec<&str> = markdown
        .split('\n')
        .map(|l| l.strip_suffix('\r').unwrap_or(l))
        .collect();
    let mut out: Vec<Cow<str>> = Vec::with_capacity(lines.len());
    let mut changed = false;
    let mut fence: Option<(char, usize)> = None;
    let mut i = 0;

    while i < lines.len() {
        let line = lines[i];
        if let Some((ch, len)) = fence {
            if is_fence(line).is_some_and(|(c, n)| c == ch && n >= len) {
                fence = None;
            }
            out.push(Cow::Borrowed(line));
            i += 1;
            continue;
        }
        if let Some(open) = is_fence(line) {
            fence = Some(open);
            out.push(Cow::Borrowed(line));
            i += 1;
            continue;
        }

        let starts_block = i == 0 || is_blank(lines[i - 1]);
        let table = starts_block
            .then(|| {
                multiline(&lines, i)
                    .or_else(|| headerless(&lines, i))
                    .or_else(|| simple(&lines, i))
            })
            .flatten();
        match table {
            Some(table) => {
                changed = true;
                out.extend(table.render().into_iter().map(Cow::Owned));
                i += table.len;
            }
            None => {
                out.push(Cow::Borrowed(line));
                i += 1;
            }
        }
    }

    if changed {
        Cow::Owned(out.join("\n"))
    } else {
        Cow::Borrowed(markdown)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SIMPLE: &str = "Intro.\n\n  Field         Type / meaning    Initial rule\n  ------------- ----------------- --------------\n  id            UUID              Generated by application\n  title         Text              Required | bounded\n\nAfter.";

    const MULTILINE: &str = "  ----------------------------------------------\n  Principle           Question to ask\n  ------------------- --------------------------\n  SRP                 Does this module have\n                      unrelated reasons?\n\n  OCP                 Can I add behavior?\n  ----------------------------------------------\n\nAfter.";

    #[test]
    fn converts_simple_tables_keeping_the_line_count() {
        let out = to_pipe_tables(SIMPLE);
        assert_eq!(out.lines().count(), SIMPLE.lines().count());
        let lines: Vec<&str> = out.lines().collect();
        assert_eq!(lines[2], "| Field | Type / meaning | Initial rule |");
        assert_eq!(lines[3], "| :-- | :-- | :-- |");
        assert_eq!(lines[4], "| id | UUID | Generated by application |");
        assert_eq!(lines[5], r"| title | Text | Required \| bounded |");
        assert_eq!(lines[7], "After.");
    }

    #[test]
    fn converts_multiline_tables_joining_wrapped_cells() {
        let out = to_pipe_tables(MULTILINE);
        assert_eq!(out.lines().count(), MULTILINE.lines().count());
        let lines: Vec<&str> = out.lines().collect();
        assert_eq!(lines[0], "| Principle | Question to ask |");
        assert_eq!(
            lines[2],
            "| SRP | Does this module have unrelated reasons? |"
        );
        assert_eq!(lines[3], "| OCP | Can I add behavior? |");
        assert!(lines[4..8].iter().all(|l| l.is_empty()));
        assert_eq!(lines[9], "After.");
    }

    #[test]
    fn converts_headerless_tables_with_an_empty_header() {
        let md = "-------  -------\nkey      value\nother    thing\n-------  -------\n";
        let out = to_pipe_tables(md);
        let lines: Vec<&str> = out.lines().collect();
        assert_eq!(lines[0], "|  |  |");
        assert_eq!(lines[2], "| key | value |");
        assert_eq!(lines[3], "| other | thing |");
    }

    #[test]
    fn alignment_follows_the_header_position() {
        // Runs at 0..7, 8..15, 16..24, 25..32: "Left" touches only the left edge,
        // "Right" only the right, "Center" neither, "Default" both.
        let md = "Left      Right  Center  Default\n------- ------- -------- -------\na       b       c        d\n";
        let out = to_pipe_tables(md);
        assert_eq!(
            out.lines().nth(1),
            Some("| :-- | --: | :-: | --- |"),
            "{out}"
        );
    }

    #[test]
    fn leaves_everything_else_alone() {
        for md in [
            "Text\n\n---\n\nMore",
            "Heading\n-------\n",
            "| a | b |\n|---|---|\n| 1 | 2 |",
            "```\nA     B\n----- -----\n1     2\n```",
            "- - -\n",
            "",
        ] {
            assert!(matches!(to_pipe_tables(md), Cow::Borrowed(_)), "{md:?}");
        }
    }

    #[test]
    fn a_table_must_start_a_block() {
        let md = "Some paragraph\nA     B\n----- -----\n1     2\n";
        assert!(matches!(to_pipe_tables(md), Cow::Borrowed(_)));
    }
}
