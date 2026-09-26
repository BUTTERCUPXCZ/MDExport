import { useNavigate, useParams } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";
import { ConflictDialog } from "@/features/documents/ConflictDialog";
import { DeleteDocumentDialog } from "@/features/documents/DeleteDocumentDialog";
import {
  useDocumentsStore,
  useOpenDocument,
  type OpenDocument,
} from "@/features/documents/documentsStore";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { MarkdownEditor } from "@/features/editor/MarkdownEditor";
import { MarkdownPreview } from "@/features/editor/MarkdownPreview";
import { collectAnchors, previewScrollFor, type Anchor } from "@/features/editor/scrollSync";
import { useMarkdownPreview, type PreviewState } from "@/features/editor/useMarkdownPreview";
import { entryForPath } from "@/features/library/libraryModel";
import { useLibraryStore } from "@/features/library/libraryStore";
import { showError } from "@/features/notices/noticeStore";
import { DeliverPanel } from "@/features/stages/DeliverPanel";
import { StageBar } from "@/features/stages/StageBar";
import { usePrefsStore } from "@/features/prefs/prefsStore";
import { useUiStore } from "@/features/ui/uiStore";
import { cn } from "@/lib/utils";
import { toAppError } from "@/types/document";

/**
 * Proof stage: the preview follows the editor's scroll. Block positions are
 * measured once per rendered preview (and again after a resize), not per frame.
 */
function useScrollSync(preview: PreviewState, previewShown: boolean) {
  const previewRef = useRef<HTMLElement>(null);
  const anchors = useRef<Anchor[] | null>(null);

  useEffect(() => {
    anchors.current = null;
  }, [preview]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => (anchors.current = null));
    observer.observe(el);
    return () => observer.disconnect();
  }, [previewShown]);

  const follow = useCallback((line: number) => {
    const el = previewRef.current;
    if (!el) return;
    anchors.current ??= collectAnchors(el);
    el.scrollTop = previewScrollFor(line, anchors.current, el.scrollHeight - el.clientHeight);
  }, []);

  return { previewRef, follow };
}

function DocumentEditor({ doc }: { doc: OpenDocument }) {
  const navigate = useNavigate();
  const { setContent, save, saveAs, reload, clearConflict, remove } = useDocumentsStore();
  const stage = useUiStore((s) => s.stage);
  const listing = useLibraryStore((s) => s.listing);
  const entry = entryForPath(listing, doc.path);
  const location = entry ? entry.relativePath.split("/").join(" / ") : doc.path;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const preview = useMarkdownPreview(doc.content, stage !== "write");
  const { previewRef, follow } = useScrollSync(preview, stage !== "write");

  // Remember library documents so the next launch reopens this one.
  const inLibrary = entry !== null;
  useEffect(() => {
    if (inLibrary) usePrefsStore.getState().setLastDocumentPath(doc.path);
  }, [doc.path, inLibrary]);

  const onChange = useCallback((value: string) => setContent(doc.id, value), [doc.id, setContent]);

  // Ctrl+S / Ctrl+Shift+S (the global hook keeps these from the webview).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      if (event.key.toLowerCase() !== "s") return;
      if (event.shiftKey) void saveAs(doc.id);
      else void save(doc.id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [doc.id, save, saveAs]);

  const deleteDocument = async () => {
    try {
      await remove(doc.id);
      void navigate({ to: "/" });
    } catch (e) {
      setConfirmDelete(false);
      showError(`Couldn't move to trash: ${toAppError(e).message}`);
    }
  };

  return (
    <>
      <StageBar
        doc={doc}
        location={location}
        onSave={() => void save(doc.id)}
        onSaveAs={() => void saveAs(doc.id)}
        onRename={() => useUiStore.getState().setRenamingPath(doc.path)}
        onDelete={() => setConfirmDelete(true)}
      />
      <div className="flex min-h-0 flex-1">
        {/* The editor stays mounted in Deliver so undo history and cursor survive. */}
        <section
          aria-label="Markdown source"
          className={cn(
            "min-w-0 flex-1 bg-canvas",
            stage === "proof" && "border-r border-line",
            stage === "deliver" && "hidden",
          )}
        >
          {/* Remount when content is replaced from disk (reload). */}
          <MarkdownEditor
            key={`${doc.id}:${doc.revision}`}
            initialValue={doc.content}
            onChange={onChange}
            onScrollLine={stage === "proof" ? follow : undefined}
          />
        </section>
        {stage !== "write" && (
          <section
            ref={previewRef}
            aria-label="Rendered preview"
            className="min-w-0 flex-1 overflow-y-auto bg-sunken px-6"
          >
            <MarkdownPreview preview={preview} />
          </section>
        )}
        {stage === "deliver" && <DeliverPanel doc={doc} />}
      </div>

      <ConflictDialog
        open={doc.conflict !== null}
        fileName={doc.name}
        onCancel={() => clearConflict(doc.id)}
        onOverwrite={() => void save(doc.id, { force: true })}
        onReload={() => void reload(doc.id)}
        onSaveCopy={() => {
          clearConflict(doc.id);
          void saveAs(doc.id);
        }}
      />
      <DeleteDocumentDialog
        open={confirmDelete}
        fileName={doc.name}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={deleteDocument}
      />
    </>
  );
}

function DocumentNotOpen() {
  const { openDocument } = useDocumentCommands();
  return (
    <div className="flex-1 overflow-y-auto">
      <EmptyState
        title="This document isn't open"
        description="It may have been closed or moved to the trash. Pick one from the library, or open a file."
        actions={
          <Button variant="secondary" onClick={() => void openDocument()}>
            <FolderOpen />
            Open file…
          </Button>
        }
      />
    </div>
  );
}

export function EditorPage() {
  const { documentId } = useParams({ from: "/shell/editor/$documentId" });
  const doc = useOpenDocument(documentId);
  return doc ? <DocumentEditor doc={doc} /> : <DocumentNotOpen />;
}
