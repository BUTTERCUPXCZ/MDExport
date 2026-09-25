import { useParams } from "@tanstack/react-router";
import { isDirty, useOpenDocument, type OpenDocument } from "@/features/documents/documentsStore";
import { useEditorStatus } from "@/features/editor/editorStatus";

function saveLabel(doc: OpenDocument): { text: string; className: string } {
  if (doc.saveState === "saving") return { text: "Saving…", className: "text-ink-2" };
  if (doc.saveState === "error") return { text: "Save failed", className: "text-danger" };
  if (isDirty(doc)) return { text: "Unsaved", className: "text-accent" };
  return { text: "Saved", className: "text-ink-3" };
}

/** Terminal-style status line. */
export function StatusBar() {
  const editor = useEditorStatus();
  const { documentId } = useParams({ strict: false });
  const doc = useOpenDocument(documentId ?? "");
  const save = doc ? saveLabel(doc) : null;

  return (
    <footer
      role="status"
      className="flex h-7 shrink-0 items-center justify-between border-t px-6 font-mono text-[11px] tracking-[0.04em] text-ink-3 uppercase"
    >
      <span>Ready</span>
      {editor && save ? (
        <span className="flex items-center gap-5">
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
