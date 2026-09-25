import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

/** Discord-styled CodeMirror theme. Colors come from CSS variables, so it follows light/dark. */
export const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    color: "var(--text-normal)",
    backgroundColor: "var(--surface-primary)",
    fontSize: "15px",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: '"Source Code Pro Variable", Consolas, "Andale Mono WT", monospace',
    lineHeight: "1.6",
  },
  ".cm-content": { padding: "16px 0", caretColor: "var(--header-primary)" },
  ".cm-line": { padding: "0 16px" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--header-primary)" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection":
    { backgroundColor: "var(--editor-selection)" },
  ".cm-activeLine": { backgroundColor: "var(--surface-hover)" },
  ".cm-gutters": {
    backgroundColor: "var(--surface-primary)",
    color: "var(--channel-default)",
    border: "none",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent",
    color: "var(--interactive-hover)",
  },
  ".cm-lineNumbers .cm-gutterElement": { padding: "0 4px 0 12px", minWidth: "32px" },
  ".cm-placeholder": { color: "var(--text-muted)" },
  ".cm-matchingBracket": {
    backgroundColor: "var(--surface-selected)",
    outline: "none",
  },
});

const highlightStyle = HighlightStyle.define([
  // Markdown structure
  { tag: t.heading, color: "var(--header-primary)", fontWeight: "700" },
  { tag: t.strong, color: "var(--header-primary)", fontWeight: "700" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: "var(--text-link)" },
  { tag: t.url, color: "var(--text-link)", textDecoration: "underline" },
  { tag: t.quote, color: "var(--text-muted)" },
  { tag: t.monospace, color: "var(--hl-string)" },
  { tag: [t.processingInstruction, t.contentSeparator], color: "var(--hl-markup)" },
  { tag: t.list, color: "var(--primary)" },

  // Code inside fenced blocks
  { tag: t.comment, color: "var(--hl-comment)", fontStyle: "italic" },
  { tag: [t.keyword, t.modifier, t.operatorKeyword, t.controlKeyword], color: "var(--hl-keyword)" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "var(--hl-string)" },
  { tag: [t.number, t.bool, t.null, t.atom, t.constant(t.name)], color: "var(--hl-constant)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--hl-function)" },
  { tag: [t.typeName, t.className, t.namespace], color: "var(--hl-type)" },
  { tag: t.tagName, color: "var(--hl-tag)" },
  { tag: t.attributeName, color: "var(--hl-attr)" },
  { tag: [t.punctuation, t.bracket], color: "var(--hl-punctuation)" },
]);

export const editorHighlighting = syntaxHighlighting(highlightStyle);
