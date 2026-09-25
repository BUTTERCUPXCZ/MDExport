import { useParams } from "@tanstack/react-router";
import { FilePlus2, Folder } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { DocumentList } from "@/features/library/DocumentList";
import { channelGroups, initials, recentDocuments } from "@/features/library/libraryModel";
import { useLibraryStore } from "@/features/library/libraryStore";

/** Landing page for a rail folder, like Discord's "Welcome to #channel". */
export function FolderPage() {
  const { folder } = useParams({ from: "/shell/folder/$folder" });
  const listing = useLibraryStore((s) => s.listing);
  const { newDocument } = useDocumentCommands();

  const groups = listing ? channelGroups(listing, folder) : [];
  const documents = groups.flatMap((g) => g.documents);
  const categories = groups.filter((g) => g.category !== null).length;

  return (
    <>
      <PageHeader icon={<Folder />} title={folder} topic={`${listing?.root ?? ""}/${folder}`} />
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <header>
            <div className="flex size-[68px] items-center justify-center rounded-full bg-surface-secondary text-2xl font-bold text-header-primary">
              {initials(folder)}
            </div>
            <h2 className="mt-4 text-[32px] leading-tight font-extrabold text-header-primary">
              Welcome to {folder}
            </h2>
            <p className="mt-1 text-base text-text-muted">
              {documents.length} {documents.length === 1 ? "document" : "documents"}
              {categories > 0 &&
                ` in ${categories} ${categories === 1 ? "subfolder" : "subfolders"}`}
              . Pick one from the sidebar, or press Ctrl+K to search.
            </p>
            <Button className="mt-4" onClick={() => void newDocument(folder)}>
              <FilePlus2 data-icon="inline-start" />
              New document in {folder}
            </Button>
          </header>

          {documents.length > 0 && (
            <DocumentList title="Recently edited" documents={recentDocuments(documents, 10)} />
          )}
        </div>
      </div>
    </>
  );
}
