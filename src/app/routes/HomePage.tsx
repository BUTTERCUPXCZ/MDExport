import { FilePlus2, FolderOpen, Keyboard, Search } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { folderOf, recentDocuments, relativeTime, stem } from "@/features/library/libraryModel";
import { useLibraryStore } from "@/features/library/libraryStore";
import { usePrefsStore } from "@/features/prefs/prefsStore";
import { useUiStore } from "@/features/ui/uiStore";
import { useNow } from "@/hooks/useNow";

function StartAction({
  icon,
  label,
  shortcut,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  shortcut: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-left text-[13.5px] text-text-2 transition-colors hover:bg-panel hover:text-text [&_svg]:size-4 [&_svg]:text-muted"
    >
      {icon}
      <span className="flex-1">{label}</span>
      <kbd className="font-sans text-[12px] text-muted">{shortcut}</kbd>
    </button>
  );
}

/** Library home: start something, or pick up where you left off. */
export function HomePage() {
  const { newDocument, openDocument, openPath } = useDocumentCommands();
  const listing = useLibraryStore((s) => s.listing);
  const { setQuickSwitcherOpen, setShortcutsOpen } = useUiStore.getState();
  const recent = recentDocuments(listing?.documents ?? [], 8);
  const libraryName = listing?.root.split(/[\\/]/).pop() || "Library";
  const now = useNow();

  // Closing the app from here reopens it here.
  useEffect(() => usePrefsStore.getState().setLastDocumentPath(null), []);

  if (listing && listing.documents.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <EmptyState
          title="Nothing here yet"
          description="Write something new, or paste Markdown into a blank document and export it as PDF, Word or HTML."
          actions={
            <>
              <Button onClick={() => void newDocument()}>
                <FilePlus2 />
                New document
              </Button>
              <Button variant="secondary" onClick={() => void openDocument()}>
                <FolderOpen />
                Open file…
              </Button>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[880px] px-8 py-14">
        <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-text">{libraryName}</h1>
        <div className="mt-8 grid gap-12 md:grid-cols-[220px_1fr]">
          <section aria-labelledby="start-heading">
            <h2 id="start-heading" className="mb-2 text-[13px] font-medium text-muted">
              Start
            </h2>
            <div className="-mx-2.5 flex flex-col">
              <StartAction
                icon={<FilePlus2 />}
                label="New document"
                shortcut="Ctrl N"
                onClick={() => void newDocument()}
              />
              <StartAction
                icon={<FolderOpen />}
                label="Open file…"
                shortcut="Ctrl O"
                onClick={() => void openDocument()}
              />
              <StartAction
                icon={<Search />}
                label="Find a document"
                shortcut="Ctrl K"
                onClick={() => setQuickSwitcherOpen(true)}
              />
              <StartAction
                icon={<Keyboard />}
                label="Keyboard shortcuts"
                shortcut="Ctrl /"
                onClick={() => setShortcutsOpen(true)}
              />
            </div>
          </section>
          <section aria-labelledby="recent-heading" className="min-w-0">
            <h2 id="recent-heading" className="mb-2 text-[13px] font-medium text-muted">
              Recently edited
            </h2>
            <ul className="border-t border-line">
              {recent.map((doc) => {
                const folder = folderOf(doc.relativePath);
                return (
                  <li key={doc.path} className="border-b border-line">
                    <button
                      type="button"
                      onClick={() => void openPath(doc.path)}
                      className="group flex w-full items-baseline gap-4 py-2.5 text-left"
                    >
                      <span className="min-w-0 flex-1 truncate text-[14px] text-text group-hover:text-accent">
                        {stem(doc.name)}
                        {folder && (
                          <span className="ml-2 text-[12.5px] text-muted">
                            {folder.split("/").join(" / ")}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-[12.5px] text-muted tabular-nums">
                        {relativeTime(doc.modifiedMs, now)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
