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

function reportStatus(state: EditorState) {
  const head = state.selection.main.head;
  const line = state.doc.lineAt(head);
  editorStatusStore.set({
    line: line.number,
    column: head - line.from + 1,
    words: wordCount(state.doc.toString()),
  });
}

export function MarkdownEditor({ initialValue, onChange }: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
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
          if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          if (update.docChanged || update.selectionSet) reportStatus(update.state);
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current! });
    reportStatus(view.state);
    view.focus();

    return () => {
      view.destroy();
      editorStatusStore.set(null);
    };
    // The editor is created once per mount; the page remounts it per document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="h-full min-h-0" data-testid="markdown-editor" />;
}
