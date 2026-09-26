import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, FolderPlus, Plus, Search, Settings } from "lucide-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { DocumentRow } from "@/components/library-index/DocumentRow";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isDirty, useDocumentsStore } from "@/features/documents/documentsStore";
import { useActiveDocument } from "@/features/documents/useActiveDocument";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import {
  entryForPath,
  libraryTree,
  shortAge,
  type FolderNode,
} from "@/features/library/libraryModel";
import { useLibraryStore } from "@/features/library/libraryStore";
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

interface TreeProps {
  activePath: string | null;
  dirty: Set<string>;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
}

function FolderHeading({
  node,
  depth,
  collapsed,
  onToggle,
}: {
  node: FolderNode;
  depth: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { newDocument } = useDocumentCommands();
  return (
    <div className="group flex h-[30px] items-center rounded-md pr-1 hover:bg-raised">
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
        <span className="ml-1 text-[11.5px] font-normal text-muted tabular-nums">{node.total}</span>
      </button>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`New document in ${node.name}`}
            onClick={() => void newDocument(node.path)}
            className="flex size-6 items-center justify-center rounded-md text-muted opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-accent-soft hover:text-text"
          >
            <Plus className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">New document here</TooltipContent>
      </Tooltip>
    </div>
  );
}

function FolderContents({ node, depth, ...tree }: TreeProps & { node: FolderNode; depth: number }) {
  const { openPath } = useDocumentCommands();
  const now = useNow();

  return (
    <>
      {node.documents.map((doc) => (
        <DocumentRow
          key={doc.path}
          fileName={doc.name}
          path={doc.path}
          title={doc.relativePath}
          age={shortAge(doc.modifiedMs, now)}
          indent={8 + depth * INDENT + (depth > 0 ? 4 : 0)}
          active={doc.path === tree.activePath}
          unsaved={tree.dirty.has(doc.path)}
          onOpen={() => void openPath(doc.path)}
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
            />
            {!isCollapsed &&
              (folder.total === 0 ? (
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
  const documents = useDocumentsStore(useShallow((s) => Object.values(s.documents)));
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

function FooterButton({
  label,
  hint,
  children,
  ...props
}: { label: string; hint: string; children: React.ReactNode } & React.ComponentProps<"button">) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-raised hover:text-text"
          {...props}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{hint}</TooltipContent>
    </Tooltip>
  );
}

/**
 * The left column: one continuous index of the library. Folders are text
 * headings with counts, documents show how long ago they changed.
 */
export function LibraryIndex() {
  const listing = useLibraryStore((s) => s.listing);
  const status = useLibraryStore((s) => s.status);
  const active = useActiveDocument();
  const { newDocument } = useDocumentCommands();
  const setQuickSwitcherOpen = useUiStore((s) => s.setQuickSwitcherOpen);
  const setCreateFolderOpen = useUiStore((s) => s.setCreateFolderOpen);
  const dirty = useDirtyPaths();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (path: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  const tree = listing ? libraryTree(listing) : null;
  const libraryName = listing?.root.split(/[\\/]/).pop() || "Library";

  return (
    <aside
      aria-label="Library"
      className="flex w-[264px] shrink-0 flex-col border-r border-line bg-panel"
    >
      <div className="flex flex-col gap-1 px-2.5 pt-3">
        <button
          type="button"
          onClick={() => setQuickSwitcherOpen(true)}
          className="flex h-8 w-full items-center gap-2 rounded-md border border-line bg-canvas px-2.5 text-[13px] text-muted transition-colors hover:border-line-strong hover:text-text-2"
        >
          <Search aria-hidden className="size-3.5 shrink-0" />
          <span className="flex-1 truncate text-left">Find a document</span>
          <kbd className="font-sans text-[11.5px]">Ctrl K</kbd>
        </button>
        <button
          type="button"
          onClick={() => void newDocument()}
          className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[13px] font-medium text-text-2 transition-colors hover:bg-raised hover:text-text"
        >
          <Plus aria-hidden className="size-3.5 shrink-0 text-accent" />
          <span className="flex-1 text-left">New document</span>
          <kbd className="font-sans text-[11.5px] font-normal text-muted">Ctrl N</kbd>
        </button>
      </div>

      <nav aria-label="Documents" className="min-h-0 flex-1 overflow-y-auto px-2.5 pb-4">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          className="mt-3 flex h-[30px] items-center rounded-md px-2 text-[13px] font-semibold text-text transition-colors hover:bg-raised data-[status=active]:bg-accent-soft"
          title={listing?.root}
        >
          <span className="truncate">{libraryName}</span>
        </Link>

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
              collapsed={collapsed}
              onToggle={toggle}
            />
          </div>
        )}
        {tree && tree.total === 0 && (
          <p className="px-2 py-1 text-[13px] text-muted">No documents yet.</p>
        )}

        <OutsideLibrary activePath={active?.path ?? null} dirty={dirty} />
      </nav>

      <div className="flex h-11 shrink-0 items-center justify-between border-t border-line px-2.5">
        <FooterButton
          label="New folder"
          hint="New folder"
          onClick={() => setCreateFolderOpen(true)}
        >
          <FolderPlus className="size-4" />
        </FooterButton>
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
    </aside>
  );
}
