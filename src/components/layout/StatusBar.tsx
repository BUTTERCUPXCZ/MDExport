import { useEditorStatus } from "@/features/editor/editorStatus";

export function StatusBar() {
  const editor = useEditorStatus();

  return (
    <footer
      role="status"
      className="flex h-6 shrink-0 items-center justify-between bg-surface-secondary-alt px-3 text-xs text-text-muted"
    >
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="size-2 rounded-full bg-success" />
        Ready
      </span>
      {editor ? (
        <span className="flex items-center gap-3">
          <span>
            Ln {editor.line}, Col {editor.column}
          </span>
          <span>
            {editor.words} {editor.words === 1 ? "word" : "words"}
          </span>
          <span className="text-warning">Not saved</span>
        </span>
      ) : (
        <span>No document open</span>
      )}
    </footer>
  );
}
