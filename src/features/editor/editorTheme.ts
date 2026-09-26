import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

/** CodeMirror theme for the "Proof" design system. Colors come from CSS tokens, so it follows light/dark. */
export const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    color: "var(--text)",
    backgroundColor: "var(--canvas)",
    fontSize: "14px",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: '"JetBrains Mono Variable", "Cascadia Code", Consolas, monospace',
    lineHeight: "1.75",
  },
  ".cm-content": { padding: "20px 0 40px", caretColor: "var(--accent)" },
  ".cm-line": { padding: "0 28px 0 12px" },
  ".cm-cursor, .cm-dropCursor": { borderLeft: "2px solid var(--accent)" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, ::selection":
    { backgroundColor: "var(--selection)" },
  ".cm-activeLine": { backgroundColor: "var(--accent-soft)" },
  ".cm-gutters": {
    backgroundColor: "var(--canvas)",
    color: "var(--muted)",
    border: "none",
  },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--text)" },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px 0 20px",
    minWidth: "44px",
    fontSize: "12px",
    fontVariantNumeric: "tabular-nums",
  },
  ".cm-placeholder": { color: "var(--muted)" },
  ".cm-matchingBracket": { backgroundColor: "var(--sunken)", outline: "none" },

  // Find / replace panel (Ctrl+F, Ctrl+H)
  ".cm-panels": { backgroundColor: "var(--panel)", color: "var(--text)" },
  ".cm-panels.cm-panels-top": { borderBottom: "1px solid var(--line)" },
  ".cm-search": {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "6px",
    padding: "8px 40px 8px 12px",
    fontFamily: "var(--font-sans)",
    fontSize: "12.5px",
  },
  ".cm-search br": { flexBasis: "100%", height: 0 },
  ".cm-search label": {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    color: "var(--text-2)",
  },
  ".cm-search input[type=checkbox]": { accentColor: "var(--accent)" },
  ".cm-textfield": {
    height: "28px",
    minWidth: "200px",
    margin: 0,
    padding: "0 8px",
    border: "1px solid var(--line-strong)",
    borderRadius: "6px",
    backgroundColor: "var(--canvas)",
    color: "var(--text)",
    fontFamily: "var(--font-mono)",
    fontSize: "12.5px",
  },
  ".cm-textfield:focus": { outline: "none", borderColor: "var(--accent)" },
  ".cm-button": {
    height: "28px",
    margin: 0,
    padding: "0 10px",
    border: "1px solid var(--line-strong)",
    borderRadius: "6px",
    backgroundImage: "none",
    backgroundColor: "var(--raised)",
    color: "var(--text)",
    fontFamily: "var(--font-sans)",
    fontSize: "12.5px",
    cursor: "pointer",
  },
  ".cm-button:hover": { backgroundColor: "var(--sunken)" },
  ".cm-search button[name=close]": {
    position: "absolute",
    top: "8px",
    right: "10px",
    width: "28px",
    height: "28px",
    borderRadius: "6px",
    color: "var(--muted)",
    fontSize: "18px",
    cursor: "pointer",
  },
  ".cm-search button[name=close]:hover": {
    backgroundColor: "var(--accent-soft)",
    color: "var(--text)",
  },
  ".cm-searchMatch": {
    backgroundColor: "rgb(227 187 107 / 0.28)",
    outline: "1px solid rgb(227 187 107 / 0.55)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: "var(--selection)",
    outline: "1px solid var(--accent)",
  },
});

const highlightStyle = HighlightStyle.define([
  // Markdown structure: markup recedes, content stays in the text color.
  { tag: t.heading, color: "var(--text)", fontWeight: "700" },
  { tag: t.strong, fontWeight: "700" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through", color: "var(--muted)" },
  { tag: t.link, color: "var(--accent)" },
  { tag: t.url, color: "var(--muted)", textDecoration: "underline" },
  { tag: t.quote, color: "var(--text-2)", fontStyle: "italic" },
  { tag: t.monospace, color: "var(--hl-string)" },
  { tag: [t.processingInstruction, t.contentSeparator], color: "var(--hl-markup)" },
  { tag: t.list, color: "var(--accent)" },

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
