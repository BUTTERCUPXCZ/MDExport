import { Hash, TerminalSquare } from "lucide-react";
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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[18%] left-1/2 z-50 w-[570px] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-lg bg-surface-secondary p-4 shadow-elevation-high"
        >
          <Dialog.Title className="sr-only">Quick switcher</Dialog.Title>
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Where would you like to go?"
            aria-label="Search documents and commands"
            role="combobox"
            aria-expanded
            aria-controls="quick-switcher-results"
            aria-activedescendant={results[selected] ? `qs-${selected}` : undefined}
            className="h-[70px] w-full rounded-md bg-surface-tertiary px-4 text-lg text-header-primary placeholder:text-text-muted focus:outline-none"
          />

          <ul
            ref={listRef}
            id="quick-switcher-results"
            role="listbox"
            aria-label="Results"
            className="mt-3 max-h-[340px] overflow-y-auto"
          >
            {results.length === 0 && (
              <li className="px-2 py-6 text-center text-sm text-text-muted">
                No documents or commands match “{query}”.
              </li>
            )}
            {results.map((result, index) => {
              const isDoc = result.kind === "document";
              const label = isDoc ? stem(result.entry.name) : result.command.label;
              const detail = isDoc
                ? folderOf(result.entry.relativePath) || "Home"
                : result.command.shortcut;
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
                    "flex h-[34px] cursor-pointer items-center gap-2 rounded-md px-2 text-base font-medium text-interactive-normal",
                    index === selected && "bg-surface-selected text-interactive-active",
                  )}
                >
                  {isDoc ? (
                    <Hash className="size-5 shrink-0 text-channel-default" />
                  ) : (
                    <TerminalSquare className="size-5 shrink-0 text-channel-default" />
                  )}
                  <span className="truncate">{label}</span>
                  {detail && (
                    <span className="ml-auto shrink-0 truncate pl-4 text-xs font-semibold text-text-muted uppercase">
                      {detail}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-xs text-text-muted">
            <span className="font-bold text-success uppercase">Protip:</span> Start with{" "}
            <kbd className="font-semibold text-header-secondary">&gt;</kbd> to search commands only.
            <span className="float-right">↑↓ to navigate · Enter to open · Esc to close</span>
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
