import { FilePlus2, FolderOpen, House, Keyboard, Search } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { DocumentList } from "@/features/library/DocumentList";
import { recentDocuments } from "@/features/library/libraryModel";
import { useLibraryStore } from "@/features/library/libraryStore";
import { useUiStore } from "@/features/ui/uiStore";

function ActionTile({
  icon,
  title,
  shortcut,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  shortcut: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg bg-surface-secondary p-4 text-left transition-colors hover:bg-surface-hover [&_svg]:size-6"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-tertiary text-interactive-normal">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-header-primary">{title}</span>
        <span className="block text-xs text-text-muted">{shortcut}</span>
      </span>
    </button>
  );
}

export function HomePage() {
  const { newDocument, openDocument } = useDocumentCommands();
  const documents = useLibraryStore((s) => s.listing?.documents);
  const { setQuickSwitcherOpen, setShortcutsOpen } = useUiStore.getState();
  const recent = recentDocuments(documents ?? [], 10);

  return (
    <>
      <PageHeader icon={<House />} title="Home" topic="Recent documents and quick actions" />
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <ActionTile
              icon={<FilePlus2 />}
              title="New document"
              shortcut="Ctrl+N"
              onClick={() => void newDocument()}
            />
            <ActionTile
              icon={<FolderOpen />}
              title="Open file"
              shortcut="Ctrl+O"
              onClick={() => void openDocument()}
            />
            <ActionTile
              icon={<Search />}
              title="Find document"
              shortcut="Ctrl+K"
              onClick={() => setQuickSwitcherOpen(true)}
            />
            <ActionTile
              icon={<Keyboard />}
              title="Shortcuts"
              shortcut="Ctrl+/"
              onClick={() => setShortcutsOpen(true)}
            />
          </div>

          {recent.length > 0 ? (
            <DocumentList title="Recently edited" documents={recent} />
          ) : (
            documents && (
              <EmptyState
                icon={<FilePlus2 />}
                title="Your library is empty"
                description="Create your first document, or add folders with the + button in the left rail."
                actions={<Button onClick={() => void newDocument()}>New document</Button>}
              />
            )
          )}
        </div>
      </div>
    </>
  );
}
