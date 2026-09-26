import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useDocumentsStore,
  useOpenDocument,
  type OpenDocument,
} from "@/features/documents/documentsStore";

/**
 * The document open in the editor route, if any. Changes on every keystroke —
 * prefer `useActiveDocumentInfo` when only the id, path or name is needed.
 */
export function useActiveDocument(): OpenDocument | undefined {
  const { documentId } = useParams({ strict: false });
  return useOpenDocument(documentId ?? "");
}

export interface DocumentInfo {
  id: string;
  path: string;
  name: string;
}

/** Id, path and name of the open document. Stable while typing, so the shell doesn't re-render. */
export function useActiveDocumentInfo(): DocumentInfo | undefined {
  const { documentId } = useParams({ strict: false });
  const [id, path, name] = useDocumentsStore(
    useShallow((s) => {
      const doc = documentId ? s.documents[documentId] : undefined;
      return doc ? [doc.id, doc.path, doc.name] : [];
    }),
  );
  return useMemo(() => (id ? { id, path: path!, name: name! } : undefined), [id, path, name]);
}

/** Id, path and name of every open document; stable while typing. */
export function useOpenDocumentInfos(): DocumentInfo[] {
  const flat = useDocumentsStore(
    useShallow((s) => Object.values(s.documents).flatMap((d) => [d.id, d.path, d.name])),
  );
  return useMemo(() => {
    const out: DocumentInfo[] = [];
    for (let i = 0; i < flat.length; i += 3) {
      out.push({ id: flat[i]!, path: flat[i + 1]!, name: flat[i + 2]! });
    }
    return out;
  }, [flat]);
}
