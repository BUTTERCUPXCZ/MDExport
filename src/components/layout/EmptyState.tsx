import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
}

export function EmptyState({ icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-surface-secondary text-interactive-normal [&_svg]:size-10">
        {icon}
      </div>
      <div className="max-w-md space-y-1">
        <h2 className="text-xl font-bold text-header-primary">{title}</h2>
        <p className="text-base text-text-muted">{description}</p>
      </div>
      {actions && <div className="mt-2 flex gap-3">{actions}</div>}
    </div>
  );
}
