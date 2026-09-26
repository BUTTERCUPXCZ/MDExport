import { useEditorStatus } from "@/features/editor/editorStatus";
import { useActiveDocumentInfo } from "@/features/documents/useActiveDocument";

/** Slim footer while a document is open: cursor position and length. */
export function StatusBar() {
  const editor = useEditorStatus();
  const doc = useActiveDocumentInfo();
  if (!doc || !editor) return null;

  const minutes = Math.max(1, Math.round(editor.words / 230));

  return (
    <footer
      aria-label="Document status"
      className="flex h-6 shrink-0 items-center justify-end gap-4 border-t border-line bg-canvas px-4 text-[11.5px] text-muted tabular-nums"
    >
      <span>
        Ln {editor.line}, Col {editor.column}
      </span>
      <span>
        {editor.words} {editor.words === 1 ? "word" : "words"}
      </span>
      <span>{minutes} min read</span>
    </footer>
  );
}
