import { useNavigate, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { EXPORT_FORMATS, useExport } from "@/features/export/useExport";
import { refreshLibrary } from "@/features/library/libraryStore";
import { STAGES, useUiStore } from "@/features/ui/uiStore";

export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  run: () => void;
}

/** Commands available in the quick switcher (type ">" to list only commands). */
export function useCommands(): Command[] {
  const navigate = useNavigate();
  const { newDocument, openDocument } = useDocumentCommands();
  const exportDocument = useExport();
  const { documentId } = useParams({ strict: false });
  const documentPath = useDocumentsStore((s) =>
    documentId ? s.documents[documentId]?.path : undefined,
  );
  const hasDocument = Boolean(documentPath);
  const { setStage, setExportFormat, setShortcutsOpen, setCreateFolderOpen, setRenamingPath } =
    useUiStore.getState();

  return useMemo(() => {
    const commands: Command[] = [
      { id: "new", label: "New document", shortcut: "Ctrl+N", run: () => void newDocument() },
      { id: "open", label: "Open file…", shortcut: "Ctrl+O", run: () => void openDocument() },
      { id: "folder", label: "New folder…", run: () => setCreateFolderOpen(true) },
      { id: "home", label: "Go to library home", run: () => void navigate({ to: "/" }) },
      { id: "refresh", label: "Refresh library", run: () => void refreshLibrary() },
      {
        id: "settings",
        label: "Open settings",
        shortcut: "Ctrl+,",
        run: () => void navigate({ to: "/settings" }),
      },
      {
        id: "shortcuts",
        label: "Keyboard shortcuts",
        shortcut: "Ctrl+/",
        run: () => setShortcutsOpen(true),
      },
    ];
    if (hasDocument && documentId) {
      const { save, saveAs } = useDocumentsStore.getState();
      commands.splice(
        2,
        0,
        { id: "save", label: "Save", shortcut: "Ctrl+S", run: () => void save(documentId) },
        {
          id: "save-as",
          label: "Save as…",
          shortcut: "Ctrl+Shift+S",
          run: () => void saveAs(documentId),
        },
        {
          id: "rename",
          label: "Rename document",
          shortcut: "F2",
          run: () => setRenamingPath(documentPath ?? null),
        },
        ...EXPORT_FORMATS.map(({ format, label }) => ({
          id: `export-${format}`,
          label: `Export as ${label}`,
          run: () => {
            const doc = useDocumentsStore.getState().documents[documentId];
            if (!doc) return;
            setExportFormat(format);
            setStage("deliver");
            void exportDocument(doc, format);
          },
        })),
        ...STAGES.map(({ stage, label }) => ({
          id: `stage-${stage}`,
          label: `Stage: ${label}`,
          run: () => setStage(stage),
        })),
      );
    }
    return commands;
  }, [
    documentId,
    documentPath,
    exportDocument,
    hasDocument,
    navigate,
    newDocument,
    openDocument,
    setCreateFolderOpen,
    setRenamingPath,
    setExportFormat,
    setShortcutsOpen,
    setStage,
  ]);
}
