import { create } from "zustand";
import { documentService } from "@/services/tauri/documents";
import { showError } from "@/features/notices/noticeStore";
import { toAppError, type DocumentFile, type FileVersion } from "@/types/document";

/** A document open in the editor. The `.md` file on disk is the source of truth. */
export interface OpenDocument {
  id: string;
  path: string;
  name: string;
  /** Current editor content. */
  content: string;
  /** Content as last read from / written to disk. `content !== savedContent` means unsaved. */
  savedContent: string;
  /** Disk version at last read/write; sent with saves to detect external edits. */
  version: FileVersion;
  saveState: "idle" | "saving" | "error";
  /** Set when a save was refused because the file changed on disk. */
  conflict: FileVersion | null;
  /** Bumped when content is replaced from disk, so the editor reloads its text. */
  revision: number;
}

export type SaveResult = "saved" | "conflict" | "error" | "cancelled";

interface DocumentsState {
  documents: Record<string, OpenDocument>;
  /** Adds an opened file, or returns the existing id if that path is already open. */
  add: (file: DocumentFile) => string;
  setContent: (id: string, content: string) => void;
  save: (id: string, options?: { force?: boolean }) => Promise<SaveResult>;
  saveAs: (id: string) => Promise<SaveResult>;
  reload: (id: string) => Promise<void>;
  clearConflict: (id: string) => void;
  close: (id: string) => void;
  remove: (id: string) => Promise<void>;
}

export const isDirty = (doc: OpenDocument) => doc.content !== doc.savedContent;

function fromFile(id: string, file: DocumentFile, revision = 0): OpenDocument {
  return {
    id,
    path: file.path,
    name: file.name,
    content: file.content,
    savedContent: file.content,
    version: file.version,
    saveState: "idle",
    conflict: null,
    revision,
  };
}

export const useDocumentsStore = create<DocumentsState>((set, get) => {
  const update = (id: string, patch: Partial<OpenDocument>) =>
    set((state) => {
      const doc = state.documents[id];
      return doc ? { documents: { ...state.documents, [id]: { ...doc, ...patch } } } : state;
    });

  return {
    documents: {},

    add(file) {
      const existing = Object.values(get().documents).find((d) => d.path === file.path);
      if (existing) return existing.id;

      const id = crypto.randomUUID();
      set((state) => ({ documents: { ...state.documents, [id]: fromFile(id, file) } }));
      return id;
    },

    setContent(id, content) {
      update(id, { content });
    },

    async save(id, options = {}) {
      const doc = get().documents[id];
      if (!doc) return "error";

      const content = doc.content;
      update(id, { saveState: "saving" });
      try {
        const version = await documentService.save(
          doc.path,
          content,
          doc.version.hash,
          options.force ?? false,
        );
        update(id, { savedContent: content, version, saveState: "idle", conflict: null });
        return "saved";
      } catch (e) {
        const error = toAppError(e);
        if (error.kind === "conflict" && error.current) {
          update(id, { saveState: "idle", conflict: error.current });
          return "conflict";
        }
        update(id, { saveState: "error" });
        showError(error.message);
        return "error";
      }
    },

    async saveAs(id) {
      const doc = get().documents[id];
      if (!doc) return "error";

      try {
        const file = await documentService.saveAs(doc.content, doc.name);
        if (!file) return "cancelled";
        // The document now points at the new file; the old file is left untouched.
        update(id, {
          path: file.path,
          name: file.name,
          savedContent: file.content,
          version: file.version,
          saveState: "idle",
          conflict: null,
        });
        return "saved";
      } catch (e) {
        showError(toAppError(e).message);
        return "error";
      }
    },

    async reload(id) {
      const doc = get().documents[id];
      if (!doc) return;
      try {
        const file = await documentService.open(doc.path);
        set((state) => ({
          documents: { ...state.documents, [id]: fromFile(id, file, doc.revision + 1) },
        }));
      } catch (e) {
        showError(toAppError(e).message);
      }
    },

    clearConflict(id) {
      update(id, { conflict: null });
    },

    close(id) {
      set((state) => {
        const documents = { ...state.documents };
        delete documents[id];
        return { documents };
      });
    },

    async remove(id) {
      const doc = get().documents[id];
      if (!doc) return;
      await documentService.delete(doc.path);
      get().close(id);
    },
  };
});

export const useOpenDocument = (id: string) => useDocumentsStore((state) => state.documents[id]);
