import { useParams } from "@tanstack/react-router";
import { useOpenDocument } from "@/features/documents/documentsStore";
import { entryForPath, HOME, serverOf } from "@/features/library/libraryModel";
import { useLibraryStore } from "@/features/library/libraryStore";

/**
 * Which rail entry is selected, derived from the route:
 * `/folder/$folder` → that folder; `/editor/$id` → the document's top folder
 * (Home for root files or files outside the library); anything else → Home.
 */
export function useActiveServer(): { server: string; activePath: string | null } {
  const { folder, documentId } = useParams({ strict: false });
  const doc = useOpenDocument(documentId ?? "");
  const listing = useLibraryStore((s) => s.listing);

  if (folder !== undefined) return { server: folder, activePath: null };
  if (doc) {
    const entry = entryForPath(listing, doc.path);
    return { server: entry ? serverOf(entry.relativePath) : HOME, activePath: doc.path };
  }
  return { server: HOME, activePath: null };
}
