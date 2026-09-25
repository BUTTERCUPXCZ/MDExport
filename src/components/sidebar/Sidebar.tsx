import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronRight,
  FilePlus2,
  FolderPlus,
  Hash,
  Keyboard,
  Plus,
  RefreshCw,
  Search,
  Settings,
} from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useEffect, useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isDirty, useDocumentsStore } from "@/features/documents/documentsStore";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import {
  channelGroups,
  entryForPath,
  HOME,
  stem,
  type ChannelGroup,
} from "@/features/library/libraryModel";
import { refreshLibrary, useLibraryStore } from "@/features/library/libraryStore";
import { useActiveServer } from "@/features/library/useActiveServer";
import { useUiStore } from "@/features/ui/uiStore";
import { cn } from "@/lib/utils";
import { appService } from "@/services/tauri/app";

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

/** A document row, styled like a Discord text channel. Unsaved = bold + dot (like unread). */
function Channel({
  name,
  title,
  active,
  unsaved,
  onOpen,
}: {
  name: string;
  title: string;
  active: boolean;
  unsaved: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-current={active ? "page" : undefined}
      aria-label={unsaved ? `${name} (unsaved changes)` : name}
      onClick={onOpen}
      className={cn(
        "relative flex h-[34px] w-full items-center gap-1.5 rounded-md px-2 text-left text-base font-medium text-channel-default transition-colors hover:bg-surface-hover hover:text-interactive-hover",
        unsaved && "text-interactive-active",
        active && "bg-surface-selected text-interactive-active",
      )}
    >
      {unsaved && !active && (
        <span aria-hidden className="absolute -left-2 h-2 w-1 rounded-r-full bg-header-primary" />
      )}
      <Hash className="size-5 shrink-0 text-channel-default" />
      <span className="truncate">{name}</span>
      {unsaved && (
        <span aria-hidden className="ml-auto size-2 shrink-0 rounded-full bg-header-primary" />
      )}
    </button>
  );
}

function SectionHeader({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <h2 className="group flex h-6 items-center justify-between pt-4 pr-2 pl-2 text-xs font-bold tracking-wide text-channel-default uppercase">
      {children}
      {action}
    </h2>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className="text-channel-default hover:text-interactive-hover"
        >
          <Plus className="size-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">New document</TooltipContent>
    </Tooltip>
  );
}

function CategoryHeader({
  label,
  collapsed,
  onToggle,
  onAdd,
}: {
  label: string;
  collapsed: boolean;
  onToggle: () => void;
  onAdd: () => void;
}) {
  const Chevron = collapsed ? ChevronRight : ChevronDown;
  return (
    <div className="group flex h-6 items-center pt-4 pr-2">
      <button
        type="button"
        aria-expanded={!collapsed}
        onClick={onToggle}
        className="flex min-w-0 flex-1 items-center gap-0.5 text-xs font-bold tracking-wide text-channel-default uppercase hover:text-interactive-hover"
      >
        <Chevron className="size-3 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
      <span className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
        <AddButton label={`New document in ${label}`} onClick={onAdd} />
      </span>
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onSelect,
}: {
  icon: ReactNode;
  children: ReactNode;
  onSelect: () => void;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className="flex h-8 cursor-pointer items-center justify-between rounded-sm px-2 text-sm font-medium text-interactive-normal outline-none data-highlighted:bg-primary data-highlighted:text-white [&_svg]:size-4"
    >
      {children}
      {icon}
    </DropdownMenu.Item>
  );
}

/** Sidebar header: folder name with a Discord-style dropdown of actions. */
function ServerHeader({ title, onNewDocument }: { title: string; onNewDocument: () => void }) {
  const setCreateFolderOpen = useUiStore((s) => s.setCreateFolderOpen);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="z-10 flex h-12 shrink-0 items-center justify-between px-4 text-base font-semibold text-header-primary shadow-elevation-low transition-colors outline-none hover:bg-surface-hover data-[state=open]:bg-surface-hover">
        <span className="truncate">{title}</span>
        <ChevronDown className="size-4 shrink-0" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[220px] rounded-md bg-surface-floating p-1.5 shadow-elevation-high"
        >
          <MenuItem icon={<FilePlus2 />} onSelect={onNewDocument}>
            New document
          </MenuItem>
          <MenuItem icon={<FolderPlus />} onSelect={() => setCreateFolderOpen(true)}>
            New folder
          </MenuItem>
          <DropdownMenu.Separator className="mx-1 my-1 h-px bg-surface-selected" />
          <MenuItem icon={<RefreshCw />} onSelect={() => void refreshLibrary()}>
            Refresh
          </MenuItem>
          <MenuItem icon={<Keyboard />} onSelect={() => setShortcutsOpen(true)}>
            Keyboard shortcuts
          </MenuItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function UserPanel() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    appService
      .getInfo()
      .then((info) => setVersion(info.version))
      .catch(() => setVersion(null));
  }, []);

  return (
    <div className="flex h-[52px] shrink-0 items-center gap-2 bg-surface-secondary-alt px-2">
      <div className="relative">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white">
          MD
        </div>
        <span
          aria-hidden
          className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-[3px] border-surface-secondary-alt bg-success"
        />
      </div>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-sm font-semibold text-header-primary">MDForge</div>
        <div className="truncate text-xs text-text-muted" data-testid="app-version">
          {version ? `v${version} · Local` : "Local"}
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to="/settings"
            aria-label="Settings"
            className="flex size-8 items-center justify-center rounded-md text-interactive-normal transition-colors hover:bg-surface-hover hover:text-interactive-hover"
          >
            <Settings className="size-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top">Settings (Ctrl+,)</TooltipContent>
      </Tooltip>
    </div>
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
    <section>
      <SectionHeader>Outside library</SectionHeader>
      <div className="mt-0.5 space-y-0.5">
        {outside.map((doc) => (
          <Channel
            key={doc.id}
            name={stem(doc.name)}
            title={doc.path}
            active={doc.path === activePath}
            unsaved={dirty.has(doc.path)}
            onOpen={() =>
              void navigate({ to: "/editor/$documentId", params: { documentId: doc.id } })
            }
          />
        ))}
      </div>
    </section>
  );
}

function ChannelList({
  groups,
  activePath,
  dirty,
  onNewDocument,
}: {
  groups: ChannelGroup[];
  activePath: string | null;
  dirty: Set<string>;
  onNewDocument: (folder: string) => void;
}) {
  const { openPath } = useDocumentCommands();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (folder: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });

  return (
    <>
      {groups.map((group) => {
        const isCollapsed = collapsed.has(group.folder);
        // A collapsed category still shows its active or unsaved documents, like Discord.
        const visible = isCollapsed
          ? group.documents.filter((d) => d.path === activePath || dirty.has(d.path))
          : group.documents;
        return (
          <section key={group.folder} aria-label={group.category ?? undefined}>
            {group.category !== null && (
              <CategoryHeader
                label={group.category}
                collapsed={isCollapsed}
                onToggle={() => toggle(group.folder)}
                onAdd={() => onNewDocument(group.folder)}
              />
            )}
            <div className="mt-0.5 space-y-0.5">
              {visible.map((doc) => (
                <Channel
                  key={doc.path}
                  name={stem(doc.name)}
                  title={doc.relativePath}
                  active={doc.path === activePath}
                  unsaved={dirty.has(doc.path)}
                  onOpen={() => void openPath(doc.path)}
                />
              ))}
              {!isCollapsed && group.documents.length === 0 && group.category !== null && (
                <p className="px-2 py-1 text-sm text-text-muted">Empty</p>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

/** Second column: the selected folder's documents, grouped by subfolder. */
export function Sidebar() {
  const listing = useLibraryStore((s) => s.listing);
  const status = useLibraryStore((s) => s.status);
  const { server, activePath } = useActiveServer();
  const { newDocument } = useDocumentCommands();
  const setQuickSwitcherOpen = useUiStore((s) => s.setQuickSwitcherOpen);
  const dirty = useDirtyPaths();

  const groups = listing ? channelGroups(listing, server) : [];
  const total = groups.reduce((n, g) => n + g.documents.length, 0);
  const libraryName = listing?.root.split(/[\\/]/).pop() || "Library";
  const isHome = server === HOME;

  return (
    <aside aria-label="Documents" className="flex w-60 shrink-0 flex-col bg-surface-secondary">
      <ServerHeader
        title={isHome ? libraryName : server}
        onNewDocument={() => void newDocument(server || undefined)}
      />

      <div className="px-2.5 pt-2.5">
        <button
          type="button"
          onClick={() => setQuickSwitcherOpen(true)}
          className="flex h-7 w-full items-center justify-between gap-2 rounded-md bg-surface-tertiary px-2 text-sm whitespace-nowrap text-text-muted hover:text-interactive-hover"
        >
          <span className="truncate">Find a document</span>
          <span className="flex shrink-0 items-center gap-1 text-xs">
            <Search className="size-3.5" /> Ctrl+K
          </span>
        </button>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-2 pt-2 pb-3">
        {isHome && (
          <>
            <Link
              to="/"
              activeOptions={{ exact: true }}
              className="mb-1 flex h-[42px] items-center gap-3 rounded-md px-2 text-base font-medium text-channel-default hover:bg-surface-hover hover:text-interactive-hover data-[status=active]:bg-surface-selected data-[status=active]:text-interactive-active"
            >
              <span
                aria-hidden
                className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white"
              >
                MD
              </span>
              Home
            </Link>
            <SectionHeader
              action={<AddButton label="New document in Home" onClick={() => void newDocument()} />}
            >
              Documents
            </SectionHeader>
          </>
        )}

        {status === "loading" && <p className="px-2 py-2 text-sm text-text-muted">Loading…</p>}
        {status === "error" && (
          <p className="px-2 py-2 text-sm text-destructive">Couldn't read the library folder.</p>
        )}

        <ChannelList
          groups={groups}
          activePath={activePath}
          dirty={dirty}
          onNewDocument={(folder) => void newDocument(folder || undefined)}
        />

        {listing && total === 0 && (
          <p className="px-2 py-1 text-sm text-text-muted">
            {isHome ? "No documents in the library root." : "No documents in this folder yet."}
          </p>
        )}

        {isHome && <OutsideLibrary activePath={activePath} dirty={dirty} />}
      </nav>

      <UserPanel />
    </aside>
  );
}
