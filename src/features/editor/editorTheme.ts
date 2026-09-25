import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

/**
 * Terminal-style CodeMirror theme. Colors come from CSS variables, so it
 * follows light/dark. Mostly ink and grays; the accent marks the caret.
 */
export const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    color: "var(--ink)",
    backgroundColor: "var(--bg)",
    fontSize: "14px",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: '"IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace',
    lineHeight: "1.7",
  },
  ".cm-content": { padding: "24px 0", caretColor: "var(--accent)" },
  ".cm-line": { padding: "0 24px 0 16px" },
  ".cm-cursor, .cm-dropCursor": { borderLeft: "2px solid var(--accent)" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection":
    { backgroundColor: "var(--selection)" },
  ".cm-activeLine": { backgroundColor: "var(--surface)" },
  ".cm-gutters": {
    backgroundColor: "var(--bg)",
    color: "var(--ink-3)",
    borderRight: "1px solid var(--line)",
  },
  ".cm-activeLineGutter": { backgroundColor: "var(--surface)", color: "var(--ink)" },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 12px 0 16px",
    minWidth: "44px",
    fontSize: "12px",
  },
  ".cm-placeholder": { color: "var(--ink-3)" },
  ".cm-matchingBracket": { backgroundColor: "var(--surface-2)", outline: "none" },
});

const highlightStyle = HighlightStyle.define([
  // Markdown structure: markup characters recede, content stays ink.
  { tag: t.heading, fontWeight: "600" },
  {
    tag: t.heading1,
    fontWeight: "600",
    textDecoration: "underline 1px",
    textUnderlineOffset: "4px",
  },
  { tag: t.strong, fontWeight: "600" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through", color: "var(--ink-3)" },
  { tag: t.link, textDecoration: "underline 1px", textUnderlineOffset: "3px" },
  { tag: t.url, color: "var(--ink-3)" },
  { tag: t.quote, color: "var(--ink-2)", fontStyle: "italic" },
  { tag: t.monospace, color: "var(--syn-string)" },
  { tag: [t.processingInstruction, t.contentSeparator], color: "var(--ink-3)" },
  { tag: t.list, color: "var(--accent)" },

  // Code inside fenced blocks
  { tag: t.comment, color: "var(--ink-3)", fontStyle: "italic" },
  { tag: [t.keyword, t.modifier, t.operatorKeyword, t.controlKeyword], fontWeight: "600" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "var(--syn-string)" },
  { tag: [t.number, t.bool, t.null, t.atom], color: "var(--accent)" },
  { tag: [t.typeName, t.className, t.namespace], color: "var(--ink-2)" },
  { tag: [t.tagName], fontWeight: "600" },
  { tag: [t.attributeName, t.punctuation, t.bracket], color: "var(--ink-2)" },
]);

export const editorHighlighting = syntaxHighlighting(highlightStyle);
