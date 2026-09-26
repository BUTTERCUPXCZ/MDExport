import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { openSearchPanel, search, searchKeymap } from "@codemirror/search";
import { EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder,
} from "@codemirror/view";
import { useEffect, useRef } from "react";
import { wordCount } from "@/features/editor/documentText";
import { editorStatusStore } from "@/features/editor/editorStatus";
import { editorHighlighting, editorTheme } from "@/features/editor/editorTheme";
import { toggleBold, toggleItalic } from "@/features/editor/formatting";

interface MarkdownEditorProps {
  /** Initial content. The editor owns the text afterwards; changes are reported via onChange. */
  initialValue: string;
  onChange: (value: string) => void;
  /**
   * Called as the editor scrolls with the source line at the top of the view
   * (fractional: 12.5 = halfway through line 12), or `Infinity` at the very end.
   */
  onScrollLine?: (line: number) => void;
}

/** Fractional source line at the top of the editor's viewport. */
function topLine(view: EditorView): number {
  const scroller = view.scrollDOM;
  if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) return Infinity;
  const block = view.lineBlockAtHeight(scroller.scrollTop);
  const line = view.state.doc.lineAt(block.from).number;
  const within = block.height > 0 ? (scroller.scrollTop - block.top) / block.height : 0;
  return line + Math.min(Math.max(within, 0), 1);
}

/** How long typing must pause before words are recounted (counting scans the whole text). */
const WORD_COUNT_DELAY_MS = 300;

function cursorStatus(state: EditorState, words: number) {
  const head = state.selection.main.head;
  const line = state.doc.lineAt(head);
  editorStatusStore.set({ line: line.number, column: head - line.from + 1, words });
}

export function MarkdownEditor({ initialValue, onChange, onScrollLine }: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const onScrollLineRef = useRef(onScrollLine);

  useEffect(() => {
    onChangeRef.current = onChange;
    onScrollLineRef.current = onScrollLine;
  }, [onChange, onScrollLine]);

  useEffect(() => {
    let words = wordCount(initialValue);
    let countTimer: number | undefined;

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        EditorView.lineWrapping,
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        search({ top: true }),
        EditorState.phrases.of({
          next: "Next",
          previous: "Previous",
          all: "All",
          "match case": "Match case",
          regexp: "Regex",
          "by word": "Whole word",
          replace: "Replace",
          "replace all": "Replace all",
          close: "Close",
        }),
        editorTheme,
        editorHighlighting,
        placeholder("Start writing Markdown…"),
        keymap.of([
          { key: "Mod-b", run: toggleBold },
          { key: "Mod-i", run: toggleItalic },
          { key: "Mod-h", run: openSearchPanel, preventDefault: true },
          ...searchKeymap,
          indentWithTab,
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        EditorView.contentAttributes.of({ "aria-label": "Markdown editor" }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
            window.clearTimeout(countTimer);
            countTimer = window.setTimeout(() => {
              words = wordCount(view.state.doc.toString());
              cursorStatus(view.state, words);
            }, WORD_COUNT_DELAY_MS);
          }
          // Cursor moves only update Ln/Col; the word count is reused.
          if (update.docChanged || update.selectionSet) cursorStatus(update.state, words);
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current! });
    cursorStatus(view.state, words);
    view.focus();

    let frame = 0;
    const onScroll = () => {
      if (!onScrollLineRef.current || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        onScrollLineRef.current?.(topLine(view));
      });
    };
    view.scrollDOM.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(countTimer);
      cancelAnimationFrame(frame);
      view.scrollDOM.removeEventListener("scroll", onScroll);
      view.destroy();
      editorStatusStore.set(null);
    };
    // The editor is created once per mount; the page remounts it per document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="h-full min-h-0" data-testid="markdown-editor" />;
}
