import { Link, type LinkProps } from "@tanstack/react-router";
import { Clock, FileText, Hash, House, LibraryBig, Plus, Search, Settings } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { ComingSoon } from "@/components/layout/ComingSoon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isDirty, useDocumentsStore } from "@/features/documents/documentsStore";
import { appService } from "@/services/tauri/app";

const itemBase =
  "group flex h-[34px] w-full items-center gap-2 rounded-md px-2 text-base font-medium transition-colors";

function SidebarLink({
  to,
  icon,
  exact,
  children,
}: {
  to: LinkProps["to"];
  icon: ReactNode;
  exact?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      className={`${itemBase} text-channel-default hover:bg-surface-hover hover:text-interactive-hover data-[status=active]:bg-surface-selected data-[status=active]:text-interactive-active`}
    >
      <span className="text-channel-default group-data-[status=active]:text-interactive-active [&_svg]:size-5">
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </Link>
  );
}

function SidebarSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="pt-4">
      <h2 className="flex h-6 items-center justify-between pr-2 pl-2 text-xs font-bold tracking-wide text-channel-default uppercase">
        {title}
        {action}
      </h2>
      <div className="mt-0.5">{children}</div>
    </section>
  );
}

/** Documents open in this session, with an unsaved-changes dot. */
function OpenDocuments() {
  const documents = useDocumentsStore(useShallow((s) => Object.values(s.documents)));
  if (documents.length === 0) return null;

  return (
    <SidebarSection title="Open documents">
      <div className="flex flex-col gap-0.5">
        {documents.map((doc) => (
          <Link
            key={doc.id}
            to="/editor/$documentId"
            params={{ documentId: doc.id }}
            title={doc.path}
            className={`${itemBase} text-channel-default hover:bg-surface-hover hover:text-interactive-hover data-[status=active]:bg-surface-selected data-[status=active]:text-interactive-active`}
          >
            <FileText className="size-5 shrink-0" />
            <span className="truncate">{doc.name}</span>
            {isDirty(doc) && (
              <span
                aria-label="Unsaved changes"
                className="ml-auto size-2 shrink-0 rounded-full bg-header-primary"
              />
            )}
          </Link>
        ))}
      </div>
    </SidebarSection>
  );
}

function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="px-2 py-1 text-sm text-text-muted">{children}</p>;
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

/** Second column (Discord's channel list): navigation, projects, tags. */
export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col bg-surface-secondary">
      <div className="z-10 flex h-12 shrink-0 items-center px-2.5 shadow-elevation-low">
        <ComingSoon label="Quick open (Ctrl+P) — coming soon">
          <button
            type="button"
            disabled
            className="flex h-7 w-[219px] items-center justify-between rounded-md bg-surface-tertiary px-2 text-sm text-text-muted"
          >
            Find or open a document
            <Search className="size-4" />
          </button>
        </ComingSoon>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-2 py-2">
        <div className="flex flex-col gap-0.5">
          <SidebarLink to="/" icon={<House />} exact>
            Home
          </SidebarLink>
          <SidebarLink to="/library" icon={<LibraryBig />}>
            Library
          </SidebarLink>
          <ComingSoon label="Recent documents — coming soon" side="right" className="flex w-full">
            <button
              type="button"
              disabled
              className={`${itemBase} text-channel-default opacity-60 [&_svg]:size-5`}
            >
              <Clock />
              Recent
            </button>
          </ComingSoon>
        </div>

        <OpenDocuments />

        <SidebarSection
          title="Projects"
          action={
            <ComingSoon label="Create project — coming soon" side="top">
              <button
                type="button"
                disabled
                aria-label="Create project"
                className="text-channel-default opacity-60"
              >
                <Plus className="size-4" />
              </button>
            </ComingSoon>
          }
        >
          <EmptyHint>No projects yet.</EmptyHint>
        </SidebarSection>

        <SidebarSection title="Tags">
          <EmptyHint>
            <Hash className="mr-1 inline size-4 align-text-bottom" />
            No tags yet.
          </EmptyHint>
        </SidebarSection>
      </nav>

      <UserPanel />
    </aside>
  );
}
