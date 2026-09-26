import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: ReactNode;
  actions?: ReactNode;
}

/** A calm, left-aligned empty state that says what to do next. */
export function EmptyState({ title, description, actions }: EmptyStateProps) {
  return (
    <div className="mx-auto max-w-[560px] px-8 py-20">
      <h2 className="text-[22px] font-semibold tracking-[-0.015em] text-balance text-text">
        {title}
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-text-2">{description}</p>
      {actions && <div className="mt-6 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
