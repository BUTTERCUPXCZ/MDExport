import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { languages } from "@codemirror/language-data";
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
}

/** How long typing must pause before words are recounted (counting scans the whole text). */
const WORD_COUNT_DELAY_MS = 300;

function cursorStatus(state: EditorState, words: number) {
  const head = state.selection.main.head;
  const line = state.doc.lineAt(head);
  editorStatusStore.set({ line: line.number, column: head - line.from + 1, words });
}

export function MarkdownEditor({ initialValue, onChange }: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
        editorTheme,
        editorHighlighting,
        placeholder("Start writing Markdown…"),
        keymap.of([
          { key: "Mod-b", run: toggleBold },
          { key: "Mod-i", run: toggleItalic },
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

    return () => {
      window.clearTimeout(countTimer);
      view.destroy();
      editorStatusStore.set(null);
    };
    // The editor is created once per mount; the page remounts it per document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="h-full min-h-0" data-testid="markdown-editor" />;
}
