import { useParams } from "@tanstack/react-router";
import { useOpenDocument, type OpenDocument } from "@/features/documents/documentsStore";

/** The document open in the editor route, if any. */
export function useActiveDocument(): OpenDocument | undefined {
  const { documentId } = useParams({ strict: false });
  return useOpenDocument(documentId ?? "");
}
