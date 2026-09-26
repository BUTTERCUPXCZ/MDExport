import { CornerDownRight, FileText, Search } from "lucide-react";
import { Dialog } from "radix-ui";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useCommands, type Command } from "@/features/commands/useCommands";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { folderOf, recentDocuments, stem } from "@/features/library/libraryModel";
import { useLibraryStore } from "@/features/library/libraryStore";
import { fuzzyScore } from "@/features/quick-switcher/fuzzy";
import { useUiStore } from "@/features/ui/uiStore";
import { cn } from "@/lib/utils";
import type { LibraryEntry } from "@/types/library";

type Result =
  | { kind: "document"; entry: LibraryEntry; score: number }
  | { kind: "command"; command: Command; score: number };

const MAX_RESULTS = 12;

function useResults(query: string): Result[] {
  const documents = useLibraryStore((s) => s.listing?.documents);
  const commands = useCommands();

  return useMemo(() => {
    const commandsOnly = query.startsWith(">");
    const q = commandsOnly ? query.slice(1) : query;
    const docs = documents ?? [];

    const commandResults: Result[] = commands.flatMap((command) => {
      const score = fuzzyScore(q, command.label);
      return score === null ? [] : [{ kind: "command" as const, command, score }];
    });
    if (commandsOnly) return commandResults.sort((a, b) => b.score - a.score);

    if (!q.trim()) {
      const recent = recentDocuments(docs, 8).map((entry): Result => ({
        kind: "document",
        entry,
        score: 0,
      }));
      return [...recent, ...commandResults.slice(0, 4)];
    }

    const docResults: Result[] = docs.flatMap((entry) => {
      const score = fuzzyScore(q, entry.relativePath);
      return score === null ? [] : [{ kind: "document" as const, entry, score }];
    });
    return [
      ...docResults.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS),
      ...commandResults.sort((a, b) => b.score - a.score).slice(0, 4),
    ];
  }, [commands, documents, query]);
}

/** Ctrl+K quick switcher: jump to any document, or type ">" to run a command. */
export function QuickSwitcher() {
  const open = useUiStore((s) => s.quickSwitcherOpen);
  // Mounted only while open, so every open starts with an empty query.
  return open ? <QuickSwitcherDialog /> : null;
}

function QuickSwitcherDialog() {
  const setOpen = useUiStore((s) => s.setQuickSwitcherOpen);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const results = useResults(query);
  const { openPath } = useDocumentCommands();
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${selected}"]`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [selected]);

  const choose = (result: Result | undefined) => {
    if (!result) return;
    setOpen(false);
    if (result.kind === "document") void openPath(result.entry.path);
    else result.command.run();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(results[selected]);
    }
  };

  return (
    <Dialog.Root open onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[16%] left-1/2 z-50 w-[580px] max-w-[calc(100vw-32px)] -translate-x-1/2 overflow-hidden rounded-xl border border-line bg-raised shadow-float"
        >
          <Dialog.Title className="sr-only">Quick switcher</Dialog.Title>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search aria-hidden className="size-4 shrink-0 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Find a document, or type > for commands"
              aria-label="Search documents and commands"
              role="combobox"
              aria-expanded
              aria-controls="quick-switcher-results"
              aria-activedescendant={results[selected] ? `qs-${selected}` : undefined}
              className="h-12 w-full bg-transparent text-[15px] text-text placeholder:text-muted focus-visible:outline-none"
            />
          </div>

          <ul
            ref={listRef}
            id="quick-switcher-results"
            role="listbox"
            aria-label="Results"
            className="max-h-[360px] overflow-y-auto p-1.5"
          >
            {results.length === 0 && (
              <li className="px-3 py-6 text-center text-[13px] text-muted">
                Nothing matches “{query}”.
              </li>
            )}
            {results.map((result, index) => {
              const isDoc = result.kind === "document";
              const label = isDoc ? stem(result.entry.name) : result.command.label;
              const detail = isDoc
                ? folderOf(result.entry.relativePath).split("/").join(" / ")
                : result.command.shortcut;
              const Icon = isDoc ? FileText : CornerDownRight;
              return (
                <li
                  key={isDoc ? result.entry.path : result.command.id}
                  id={`qs-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={index === selected}
                  onMouseMove={() => setSelected(index)}
                  onClick={() => choose(result)}
                  className={cn(
                    "flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-[13.5px] text-text-2",
                    index === selected && "bg-accent-soft text-text",
                  )}
                >
                  <Icon
                    aria-hidden
                    className={cn(
                      "size-4 shrink-0 text-muted",
                      index === selected && "text-accent",
                    )}
                  />
                  <span className="truncate">{label}</span>
                  {detail && (
                    <span className="ml-auto shrink-0 truncate pl-4 text-[12px] text-muted">
                      {detail}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="flex justify-between border-t border-line px-4 py-2 text-[12px] text-muted">
            <span>
              Start with <kbd className="font-mono text-text-2">&gt;</kbd> for commands only
            </span>
            <span>↑↓ move · Enter open · Esc close</span>
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
