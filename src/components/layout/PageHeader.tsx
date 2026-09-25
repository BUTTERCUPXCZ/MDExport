import type { ReactNode } from "react";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  /** Short muted text after the title (Discord's channel topic). */
  topic?: string;
  actions?: ReactNode;
}

/** 48px top bar of the main column. */
export function PageHeader({ icon, title, topic, actions }: PageHeaderProps) {
  return (
    <header className="z-10 flex h-12 shrink-0 items-center gap-2 bg-surface-primary px-4 shadow-elevation-low">
      <span className="text-channel-default [&_svg]:size-6">{icon}</span>
      <h1 className="truncate text-base font-semibold text-header-primary">{title}</h1>
      {topic && (
        <>
          <span aria-hidden className="mx-2 h-6 w-px bg-surface-selected" />
          <p className="truncate text-sm text-text-muted">{topic}</p>
        </>
      )}
      {actions && <div className="ml-auto flex items-center gap-4">{actions}</div>}
    </header>
  );
}
