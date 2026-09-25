import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isDirty, useDocumentsStore } from "@/features/documents/documentsStore";
import {
  entryForPath,
  HOME,
  initials,
  serverOf,
  topLevelFolders,
} from "@/features/library/libraryModel";
import { useLibraryStore } from "@/features/library/libraryStore";
import { useActiveServer } from "@/features/library/useActiveServer";
import { useUiStore } from "@/features/ui/uiStore";
import { cn } from "@/lib/utils";

const railIcon =
  "group relative flex size-12 items-center justify-center rounded-3xl transition-all duration-150 hover:rounded-2xl";

/**
 * White pill on the rail's left edge (Discord's indicator):
 * tall = selected, short = hover, small dot = has unsaved documents.
 */
function Pill({ active, unsaved }: { active: boolean; unsaved: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute top-1/2 -left-3 w-1 -translate-y-1/2 rounded-r-full bg-header-primary transition-all duration-150",
        active ? "h-10" : unsaved ? "h-2 group-hover:h-5" : "h-0 group-hover:h-5",
      )}
    />
  );
}

function RailItem({
  label,
  active,
  unsaved,
  children,
  ...link
}: {
  label: string;
  active: boolean;
  unsaved: boolean;
  children: ReactNode;
} & ({ to: "/" } | { to: "/folder/$folder"; params: { folder: string } })) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          {...link}
          aria-label={unsaved ? `${label} (unsaved changes)` : label}
          aria-current={active ? "page" : undefined}
          className={cn(
            railIcon,
            "bg-surface-primary text-text-normal hover:bg-primary hover:text-white",
            active && "rounded-2xl bg-primary text-white",
          )}
        >
          <Pill active={active} unsaved={unsaved} />
          {children}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Servers with unsaved open documents, so the rail can flag them. */
function useUnsavedServers(): Set<string> {
  const listing = useLibraryStore((s) => s.listing);
  const dirtyPaths = useDocumentsStore(
    useShallow((s) =>
      Object.values(s.documents)
        .filter(isDirty)
        .map((d) => d.path),
    ),
  );
  return new Set(
    dirtyPaths.map((path) => {
      const entry = entryForPath(listing, path);
      return entry ? serverOf(entry.relativePath) : HOME;
    }),
  );
}

/** Far-left rail: Home + one entry per top-level library folder. */
export function ServerRail() {
  const listing = useLibraryStore((s) => s.listing);
  const { server } = useActiveServer();
  const unsaved = useUnsavedServers();
  const setCreateFolderOpen = useUiStore((s) => s.setCreateFolderOpen);
  const folders = listing ? topLevelFolders(listing) : [];

  return (
    <nav
      aria-label="Folders"
      className="flex w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-surface-tertiary py-3"
    >
      <RailItem to="/" label="Home" active={server === HOME} unsaved={unsaved.has(HOME)}>
        <span className="text-sm font-extrabold tracking-tight">MD</span>
      </RailItem>

      <div className="h-0.5 w-8 shrink-0 rounded-full bg-surface-selected" role="separator" />

      {folders.map((folder) => (
        <RailItem
          key={folder}
          to="/folder/$folder"
          params={{ folder }}
          label={folder}
          active={server === folder}
          unsaved={unsaved.has(folder)}
        >
          <span className="text-base font-semibold">{initials(folder)}</span>
        </RailItem>
      ))}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Create folder"
            onClick={() => setCreateFolderOpen(true)}
            className={cn(
              railIcon,
              "bg-surface-primary text-success hover:bg-success hover:text-white",
            )}
          >
            <Plus className="size-6" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Create folder</TooltipContent>
      </Tooltip>
    </nav>
  );
}
