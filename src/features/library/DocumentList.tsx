import { Hash } from "lucide-react";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { folderOf, relativeTime, stem } from "@/features/library/libraryModel";
import type { LibraryEntry } from "@/types/library";

/** Discord friends-list style rows: name, folder, last edited. */
export function DocumentList({ title, documents }: { title: string; documents: LibraryEntry[] }) {
  const { openPath } = useDocumentCommands();

  return (
    <section>
      <h2 className="mb-2 px-2.5 text-xs font-semibold tracking-wide text-header-secondary uppercase">
        {title} — {documents.length}
      </h2>
      <ul>
        {documents.map((doc) => (
          <li key={doc.path} className="border-t border-border first:border-t-0">
            <button
              type="button"
              onClick={() => void openPath(doc.path)}
              className="group flex h-[62px] w-full items-center gap-3 rounded-lg px-2.5 text-left hover:bg-surface-hover"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-tertiary text-channel-default group-hover:text-interactive-hover">
                <Hash className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-semibold text-header-primary">
                  {stem(doc.name)}
                </span>
                <span className="block truncate text-sm text-text-muted">
                  {folderOf(doc.relativePath) || "Home"}
                </span>
              </span>
              <span className="shrink-0 text-xs text-text-muted">
                {relativeTime(doc.modifiedMs)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
