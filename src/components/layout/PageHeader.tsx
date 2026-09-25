import type { ReactNode } from "react";

interface PageHeaderProps {
  /** Section label, e.g. "Library". Shown in small mono caps before the title. */
  section?: string;
  title: string;
  /** Secondary metadata, e.g. the file path. */
  meta?: string;
  actions?: ReactNode;
}

/** 44px top bar: section / title — meta ........ actions */
export function PageHeader({ section, title, meta, actions }: PageHeaderProps) {
  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b px-6">
      {section && (
        <>
          <span className="label">{section}</span>
          <span aria-hidden className="text-ink-3">
            /
          </span>
        </>
      )}
      <h1 className="truncate text-[14px] font-semibold">{title}</h1>
      {meta && <p className="min-w-0 truncate font-mono text-[11px] text-ink-3">{meta}</p>}
      {actions && <div className="ml-auto flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}
