import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Small mono label above the title, e.g. "Library — 0 documents". */
  label: string;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
}

/** Left-aligned, type-led empty state. */
export function EmptyState({ label, title, description, actions }: EmptyStateProps) {
  return (
    <div className="max-w-2xl px-6 py-16 md:px-12">
      <p className="label">{label}</p>
      <h2 className="mt-3 text-[28px] leading-tight font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-2">{description}</p>
      {actions && <div className="mt-8 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
