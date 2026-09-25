import { useNavigate, useParams } from "@tanstack/react-router";
import { FileQuestion, FileText, FolderOpen } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DocumentActions } from "@/components/layout/DocumentActions";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ConflictDialog } from "@/features/documents/ConflictDialog";
import { DeleteDocumentDialog } from "@/features/documents/DeleteDocumentDialog";
import {
  isDirty,
  useDocumentsStore,
  useOpenDocument,
  type OpenDocument,
} from "@/features/documents/documentsStore";
import { EditorActions } from "@/features/documents/EditorActions";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { documentTitle } from "@/features/editor/documentText";
import { MarkdownEditor } from "@/features/editor/MarkdownEditor";
import { MarkdownPreview } from "@/features/editor/MarkdownPreview";
import { useMarkdownPreview } from "@/features/editor/useMarkdownPreview";
import { ViewModeToggle, type ViewMode } from "@/features/editor/ViewModeToggle";
import { showError } from "@/features/notices/noticeStore";
import { cn } from "@/lib/utils";
import { toAppError } from "@/types/document";

const stripExtension = (name: string) => name.replace(/\.(md|markdown)$/i, "");

function DocumentEditor({ doc }: { doc: OpenDocument }) {
  const navigate = useNavigate();
  const { setContent, save, saveAs, reload, clearConflict, remove } = useDocumentsStore();
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const preview = useMarkdownPreview(doc.content);
  const dirty = isDirty(doc);

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
      <PageHeader
        icon={<FileText />}
        title={(documentTitle(doc.content) ?? stripExtension(doc.name)) + (dirty ? " •" : "")}
        topic={doc.path}
        actions={
          <>
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <span aria-hidden className="h-6 w-px bg-surface-selected" />
            <EditorActions
              canSave={dirty && doc.saveState !== "saving"}
              onSave={() => void save(doc.id)}
              onSaveAs={() => void saveAs(doc.id)}
              onDelete={() => setConfirmDelete(true)}
            />
          </>
        }
      />
      <div className="flex min-h-0 flex-1">
        <section
          aria-label="Markdown source"
          className={cn("min-w-0 flex-1", viewMode === "preview" && "hidden")}
        >
          {/* Remount when content is replaced from disk (reload). */}
          <MarkdownEditor
            key={`${doc.id}:${doc.revision}`}
            initialValue={doc.content}
            onChange={onChange}
          />
        </section>
        {viewMode === "split" && <div aria-hidden className="w-px shrink-0 bg-surface-selected" />}
        <section
          aria-label="Rendered preview"
          className={cn("min-w-0 flex-1 overflow-y-auto", viewMode === "editor" && "hidden")}
        >
          <MarkdownPreview preview={preview} />
        </section>
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
    <>
      <PageHeader icon={<FileText />} title="No document" actions={<DocumentActions />} />
      <div className="flex-1 overflow-y-auto">
        <EmptyState
          icon={<FileQuestion />}
          title="This document isn't open"
          description="It may have been closed or moved to the trash. Open a file to keep working."
          actions={
            <Button onClick={() => void openDocument()}>
              <FolderOpen data-icon="inline-start" />
              Open file
            </Button>
          }
        />
      </div>
    </>
  );
}

export function EditorPage() {
  const { documentId } = useParams({ from: "/shell/editor/$documentId" });
  const doc = useOpenDocument(documentId);
  return doc ? <DocumentEditor doc={doc} /> : <DocumentNotOpen />;
}
