import { Link, type LinkProps } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { ComingSoon } from "@/components/layout/ComingSoon";
import { isDirty, useDocumentsStore } from "@/features/documents/documentsStore";
import { appService } from "@/services/tauri/app";

/** Shared row style: 2px left rule marks the active item. */
const row =
  "group flex h-8 w-full items-center gap-3 border-l-2 border-transparent pr-3 pl-[14px] text-[13px] text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink data-[status=active]:border-accent data-[status=active]:bg-surface-2 data-[status=active]:text-ink";

function IndexLink({
  to,
  index,
  exact,
  children,
}: {
  to: LinkProps["to"];
  index: string;
  exact?: boolean;
  children: ReactNode;
}) {
  return (
    <Link to={to} activeOptions={{ exact }} className={row}>
      <span
        aria-hidden
        className="w-5 font-mono text-[11px] text-ink-3 group-data-[status=active]:text-accent"
      >
        {index}
      </span>
      <span className="truncate">{children}</span>
    </Link>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t pt-3 pb-2">
      <h2 className="flex items-center justify-between px-4 pb-1.5 label">
        {title}
        {aside}
      </h2>
      {children}
    </section>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="px-4 py-1 font-mono text-[11px] text-ink-3">{children}</p>;
}

/** Documents open in this session. `*` marks unsaved changes, like a terminal editor. */
function OpenDocuments() {
  const documents = useDocumentsStore(useShallow((s) => Object.values(s.documents)));
  if (documents.length === 0) return null;

  return (
    <Section title="Open" aside={<span>{String(documents.length).padStart(2, "0")}</span>}>
      {documents.map((doc) => (
        <Link
          key={doc.id}
          to="/editor/$documentId"
          params={{ documentId: doc.id }}
          title={doc.path}
          className={row}
        >
          <span className="min-w-0 flex-1 truncate">{doc.name}</span>
          {isDirty(doc) && (
            <span aria-label="Unsaved changes" className="font-mono text-accent">
              *
            </span>
          )}
        </Link>
      ))}
    </Section>
  );
}

function Footer() {
  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    appService
      .getInfo()
      .then((info) => setVersion(info.version))
      .catch(() => setVersion(null));
  }, []);

  return (
    <div className="flex h-10 shrink-0 items-center justify-between border-t px-4">
      <span className="font-mono text-[11px] text-ink-3" data-testid="app-version">
        {version ? `v${version} · local` : "local"}
      </span>
      <Link
        to="/settings"
        className="font-mono text-[11px] text-ink-2 hover:text-ink data-[status=active]:text-accent"
      >
        Settings
      </Link>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-surface">
      <div className="flex h-11 shrink-0 items-center border-b px-4">
        <Link to="/" className="font-mono text-[13px] font-semibold tracking-tight">
          mdforge<span className="text-accent">_</span>
        </Link>
      </div>

      <div className="px-3 pt-3">
        <ComingSoon label="Quick open — coming soon" className="flex w-full">
          <button
            type="button"
            disabled
            className="flex h-8 w-full items-center justify-between border bg-bg px-2.5 text-[13px] text-ink-3"
          >
            Find document
            <kbd className="font-mono text-[10px]">Ctrl+P</kbd>
          </button>
        </ComingSoon>
      </div>

      <nav aria-label="Main" className="flex-1 overflow-y-auto pt-3">
        <div className="pb-3">
          <IndexLink to="/" index="01" exact>
            Home
          </IndexLink>
          <IndexLink to="/library" index="02">
            Library
          </IndexLink>
          <ComingSoon label="Recent documents — coming soon" side="right" className="flex w-full">
            <span className={`${row} pointer-events-none text-ink-3`}>
              <span aria-hidden className="w-5 font-mono text-[11px]">
                03
              </span>
              Recent
            </span>
          </ComingSoon>
        </div>

        <OpenDocuments />

        <Section title="Projects">
          <Hint>None yet</Hint>
        </Section>

        <Section title="Tags">
          <Hint>None yet</Hint>
        </Section>
      </nav>

      <Footer />
    </aside>
  );
}
