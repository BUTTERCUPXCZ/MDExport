import { useParams } from "@tanstack/react-router";
import { isDirty, useOpenDocument, type OpenDocument } from "@/features/documents/documentsStore";
import { useEditorStatus } from "@/features/editor/editorStatus";

function saveLabel(doc: OpenDocument): { text: string; className: string } {
  if (doc.saveState === "saving") return { text: "Saving…", className: "" };
  if (doc.saveState === "error") return { text: "Save failed", className: "text-destructive" };
  if (isDirty(doc)) return { text: "Unsaved changes", className: "text-warning" };
  return { text: "Saved", className: "text-success" };
}

export function StatusBar() {
  const editor = useEditorStatus();
  const { documentId } = useParams({ strict: false });
  const doc = useOpenDocument(documentId ?? "");
  const save = doc ? saveLabel(doc) : null;

  return (
    <footer
      role="status"
      className="flex h-6 shrink-0 items-center justify-between bg-surface-secondary-alt px-3 text-xs text-text-muted"
    >
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="size-2 rounded-full bg-success" />
        Ready
      </span>
      {editor && save ? (
        <span className="flex items-center gap-3">
          <span>
            Ln {editor.line}, Col {editor.column}
          </span>
          <span>
            {editor.words} {editor.words === 1 ? "word" : "words"}
          </span>
          <span className={save.className}>{save.text}</span>
        </span>
      ) : (
        <span>No document open</span>
      )}
    </footer>
  );
}
