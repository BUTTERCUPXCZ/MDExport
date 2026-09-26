import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Copy, FilePlus2, FolderPlus, Search, Settings, Trash2 } from "lucide-react";
import { ContextMenu } from "radix-ui";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { CreateField } from "@/components/library-index/CreateField";
import { CreateMenu } from "@/components/library-index/CreateMenu";
import { DocumentRow } from "@/components/library-index/DocumentRow";
import {
  IndexMenuContent,
  IndexMenuItem,
  IndexMenuSeparator,
} from "@/components/library-index/IndexMenu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isDirty, useDocumentsStore } from "@/features/documents/documentsStore";
import {
  useActiveDocumentInfo,
  useOpenDocumentInfos,
} from "@/features/documents/useActiveDocument";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import {
  entryForPath,
  folderOf,
  libraryTree,
  shortAge,
  type FolderNode,
} from "@/features/library/libraryModel";
import { DeleteDocumentDialog } from "@/features/documents/DeleteDocumentDialog";
import { DeleteFolderDialog } from "@/features/library/DeleteFolderDialog";
import { useLibraryStore } from "@/features/library/libraryStore";
import { folderPrefix, useLibraryTrash } from "@/features/library/useLibraryTrash";
import { showError } from "@/features/notices/noticeStore";
import { useUiStore } from "@/features/ui/uiStore";
import { useNow } from "@/hooks/useNow";
import { cn } from "@/lib/utils";

/** Paths of open documents with unsaved changes. */
function useDirtyPaths(): Set<string> {
  const paths = useDocumentsStore(
    useShallow((s) =>
      Object.values(s.documents)
        .filter(isDirty)
        .map((d) => d.path),
    ),
  );
  return new Set(paths);
}

const INDENT = 14;
const heading = "px-2 pt-5 pb-1.5 text-[12px] font-medium text-muted";

/** What the user asked to move to the trash, waiting for confirmation. */
type TrashTarget =
  { kind: "document"; path: string; name: string } | { kind: "folder"; node: FolderNode };

interface TreeProps {
  activePath: string | null;
  dirty: Set<string>;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
  onTrash: (target: TrashTarget) => void;
  /** Current time for age labels; one timer for the whole tree. */
  now: number;
  /** Inline "new document / folder" field, if open. */
  creating: { kind: "document" | "folder"; parent: string } | null;
}

function copyToClipboard(text: string) {
  navigator.clipboard
    ?.writeText(text)
    .catch(() => showError("Couldn't copy the path to the clipboard."));
}

function FolderHeading({
  node,
  depth,
  collapsed,
  onToggle,
  onTrash,
}: {
  node: FolderNode;
  depth: number;
  collapsed: boolean;
  onToggle: () => void;
  onTrash: () => void;
}) {
  const startCreating = useUiStore((s) => s.startCreating);
  const root = useLibraryStore((s) => s.listing?.root);
  const hoverButton =
    "flex size-6 items-center justify-center rounded-md text-muted opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-accent-soft hover:text-text";
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <div className="group flex h-[30px] items-center rounded-md pr-1 hover:bg-raised data-[state=open]:bg-raised">
          <button
            type="button"
            aria-expanded={!collapsed}
            onClick={onToggle}
            style={{ paddingLeft: 4 + depth * INDENT }}
            className="flex h-full min-w-0 flex-1 items-center gap-1 text-left text-[13px] font-medium text-text-2 hover:text-text"
          >
            <ChevronRight
              aria-hidden
              className={cn(
                "size-3.5 shrink-0 text-muted transition-transform duration-150",
                !collapsed && "rotate-90",
              )}
            />
            <span className="truncate">{node.name}</span>
            <span className="ml-1 text-[11.5px] font-normal text-muted tabular-nums">
              {node.total}
            </span>
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`New document in ${node.name}`}
                onClick={() => startCreating("document", node.path)}
                className={hoverButton}
              >
                <FilePlus2 className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">New document</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`New folder in ${node.name}`}
                onClick={() => startCreating("folder", node.path)}
                className={hoverButton}
              >
                <FolderPlus className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">New folder</TooltipContent>
          </Tooltip>
        </div>
      </ContextMenu.Trigger>
      <IndexMenuContent>
        <IndexMenuItem icon={<FilePlus2 />} onSelect={() => startCreating("document", node.path)}>
          New document
        </IndexMenuItem>
        <IndexMenuItem icon={<FolderPlus />} onSelect={() => startCreating("folder", node.path)}>
          New folder
        </IndexMenuItem>
        {root && (
          <IndexMenuItem
            icon={<Copy />}
            onSelect={() => copyToClipboard(folderPrefix(root, node.path).slice(0, -1))}
          >
            Copy path
          </IndexMenuItem>
        )}
        <IndexMenuSeparator />
        <IndexMenuItem icon={<Trash2 />} danger onSelect={onTrash}>
          Move folder to trash
        </IndexMenuItem>
      </IndexMenuContent>
    </ContextMenu.Root>
  );
}

function FolderContents({ node, depth, ...tree }: TreeProps & { node: FolderNode; depth: number }) {
  const { openPath } = useDocumentCommands();

  const indent = 8 + depth * INDENT + (depth > 0 ? 4 : 0);
  return (
    <>
      {tree.creating?.parent === node.path && (
        <CreateField kind={tree.creating.kind} parent={node.path} indent={indent} />
      )}
      {node.documents.map((doc) => (
        <DocumentRow
          key={doc.path}
          fileName={doc.name}
          path={doc.path}
          title={doc.relativePath}
          age={shortAge(doc.modifiedMs, tree.now)}
          indent={indent}
          active={doc.path === tree.activePath}
          unsaved={tree.dirty.has(doc.path)}
          onOpen={() => void openPath(doc.path)}
          onTrash={() => tree.onTrash({ kind: "document", path: doc.path, name: doc.name })}
          folder={node.path}
        />
      ))}
      {node.folders.map((folder) => {
        const isCollapsed = tree.collapsed.has(folder.path);
        return (
          <div key={folder.path} role="group" aria-label={folder.name}>
            <FolderHeading
              node={folder}
              depth={depth}
              collapsed={isCollapsed}
              onToggle={() => tree.onToggle(folder.path)}
              onTrash={() => tree.onTrash({ kind: "folder", node: folder })}
            />
            {!isCollapsed &&
              (folder.documents.length === 0 &&
              folder.folders.length === 0 &&
              tree.creating?.parent !== folder.path ? (
                <p
                  style={{ paddingLeft: 12 + (depth + 1) * INDENT }}
                  className="h-[26px] text-[12.5px] leading-[26px] text-muted"
                >
                  Empty
                </p>
              ) : (
                <FolderContents node={folder} depth={depth + 1} {...tree} />
              ))}
          </div>
        );
      })}
    </>
  );
}

/** Open documents that live outside the library (opened via the file dialog). */
function OutsideLibrary({ activePath, dirty }: { activePath: string | null; dirty: Set<string> }) {
  const navigate = useNavigate();
  const listing = useLibraryStore((s) => s.listing);
  const documents = useOpenDocumentInfos();
  const outside = documents.filter((d) => !entryForPath(listing, d.path));
  if (outside.length === 0) return null;

  return (
    <section aria-label="Outside library">
      <h2 className={heading}>Outside library</h2>
      {outside.map((doc) => (
        <DocumentRow
          key={doc.id}
          fileName={doc.name}
          path={doc.path}
          title={doc.path}
          active={doc.path === activePath}
          unsaved={dirty.has(doc.path)}
          onOpen={() =>
            void navigate({ to: "/editor/$documentId", params: { documentId: doc.id } })
          }
        />
      ))}
    </section>
  );
}

/**
 * The left column: one continuous index of the library. Folders are text
 * headings with counts, documents show how long ago they changed.
 */
export function LibraryIndex() {
  const listing = useLibraryStore((s) => s.listing);
  const status = useLibraryStore((s) => s.status);
  const active = useActiveDocumentInfo();
  const setQuickSwitcherOpen = useUiStore((s) => s.setQuickSwitcherOpen);
  const creating = useUiStore((s) => s.creating);
  const startCreating = useUiStore((s) => s.startCreating);
  const dirty = useDirtyPaths();
  const { trashDocument, trashFolder } = useLibraryTrash();
  const [trash, setTrash] = useState<TrashTarget | null>(null);
  const now = useNow();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (path: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  // Creating inside a collapsed folder shows it (and its parents) open, like VS Code.
  const visiblyCollapsed = useMemo(() => {
    let path = creating?.parent ?? "";
    if (!path) return collapsed;
    const next = new Set(collapsed);
    while (path) {
      next.delete(path);
      path = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    }
    return next;
  }, [collapsed, creating]);

  const tree = useMemo(() => (listing ? libraryTree(listing) : null), [listing]);
  const libraryName = listing?.root.split(/[\\/]/).pop() || "Library";
  // "+" creates next to the open document (like VS Code's selected folder), else at the top.
  const activeEntry = active ? entryForPath(listing, active.path) : null;
  const createFolder = activeEntry ? folderOf(activeEntry.relativePath) : "";

  return (
    <aside
      aria-label="Library"
      className="flex w-[264px] shrink-0 flex-col border-r border-line bg-panel"
    >
      <div className="px-2.5 pt-3">
        <button
          type="button"
          onClick={() => setQuickSwitcherOpen(true)}
          className="flex h-8 w-full items-center gap-2 rounded-md border border-line bg-canvas px-2.5 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-text-2"
        >
          <Search aria-hidden className="size-3.5 shrink-0" />
          <span className="flex-1 truncate text-left">Find a document</span>
          <kbd className="font-sans text-[11.5px]">Ctrl K</kbd>
        </button>
      </div>

      {/* Right-click on empty space: create at the top of the library. Rows and
          folders have their own menus (they handle the event first). */}
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <nav aria-label="Documents" className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-4">
            <div className="mt-3 flex items-center gap-1">
              <ContextMenu.Root>
                <ContextMenu.Trigger asChild>
                  <Link
                    to="/"
                    activeOptions={{ exact: true }}
                    className="flex h-[30px] min-w-0 flex-1 items-center rounded-md px-2 text-[13px] font-semibold text-text transition-colors hover:bg-raised data-[state=open]:bg-raised data-[status=active]:bg-accent-soft"
                    title={listing?.root}
                  >
                    <span className="truncate">{libraryName}</span>
                  </Link>
                </ContextMenu.Trigger>
                <IndexMenuContent>
                  <IndexMenuItem icon={<FilePlus2 />} onSelect={() => startCreating("document")}>
                    New document
                  </IndexMenuItem>
                  <IndexMenuItem icon={<FolderPlus />} onSelect={() => startCreating("folder")}>
                    New folder
                  </IndexMenuItem>
                </IndexMenuContent>
              </ContextMenu.Root>
              <CreateMenu folder={createFolder} />
            </div>

            {status === "loading" && !tree && (
              <p className="px-2 py-2 text-[13px] text-muted">Reading the library…</p>
            )}
            {status === "error" && (
              <p role="alert" className="px-2 py-2 text-[13px] text-danger">
                Couldn't read the library folder.
              </p>
            )}

            {tree && (
              <div className="mt-0.5">
                <FolderContents
                  node={tree}
                  depth={0}
                  activePath={active?.path ?? null}
                  dirty={dirty}
                  collapsed={visiblyCollapsed}
                  onToggle={toggle}
                  onTrash={setTrash}
                  now={now}
                  creating={creating}
                />
              </div>
            )}
            {tree && tree.total === 0 && (
              <p className="px-2 py-1 text-[13px] text-muted">No documents yet.</p>
            )}

            <OutsideLibrary activePath={active?.path ?? null} dirty={dirty} />
          </nav>
        </ContextMenu.Trigger>
        <IndexMenuContent>
          <IndexMenuItem icon={<FilePlus2 />} onSelect={() => startCreating("document")}>
            New document
          </IndexMenuItem>
          <IndexMenuItem icon={<FolderPlus />} onSelect={() => startCreating("folder")}>
            New folder
          </IndexMenuItem>
        </IndexMenuContent>
      </ContextMenu.Root>

      <div className="flex h-11 shrink-0 items-center justify-end border-t border-line px-2.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/settings"
              aria-label="Settings"
              className="flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-text data-[status=active]:text-accent"
            >
              <Settings className="size-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top">Settings (Ctrl+,)</TooltipContent>
        </Tooltip>
      </div>

      <DeleteDocumentDialog
        open={trash?.kind === "document"}
        fileName={trash?.kind === "document" ? trash.name : ""}
        onCancel={() => setTrash(null)}
        onConfirm={async () => {
          if (trash?.kind === "document") await trashDocument(trash.path);
          setTrash(null);
        }}
      />
      <DeleteFolderDialog
        open={trash?.kind === "folder"}
        name={trash?.kind === "folder" ? trash.node.name : ""}
        documents={trash?.kind === "folder" ? trash.node.total : 0}
        unsaved={
          trash?.kind === "folder" && listing
            ? [...dirty].filter((p) => p.startsWith(folderPrefix(listing.root, trash.node.path)))
                .length
            : 0
        }
        onCancel={() => setTrash(null)}
        onConfirm={async () => {
          if (trash?.kind === "folder") await trashFolder(trash.node.path);
          setTrash(null);
        }}
      />
    </aside>
  );
}
