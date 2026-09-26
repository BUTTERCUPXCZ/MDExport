import { ContextMenu } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Right-click menu shell shared by documents, folders and the library root. */
export function IndexMenuContent({ children }: { children: ReactNode }) {
  return (
    <ContextMenu.Portal>
      <ContextMenu.Content
        onCloseAutoFocus={(event) => event.preventDefault()}
        className="z-50 w-[220px] rounded-lg border border-line bg-raised p-1 shadow-float"
      >
        {children}
      </ContextMenu.Content>
    </ContextMenu.Portal>
  );
}

export function IndexMenuItem({
  icon,
  hint,
  danger,
  children,
  onSelect,
}: {
  icon: ReactNode;
  hint?: string;
  danger?: boolean;
  children: ReactNode;
  onSelect: () => void;
}) {
  return (
    <ContextMenu.Item
      onSelect={onSelect}
      className={cn(
        "flex h-8 cursor-pointer items-center justify-between gap-6 rounded-md px-2 text-[13px] text-text-2 outline-none data-highlighted:bg-accent-soft data-highlighted:text-text [&_svg]:size-4 [&_svg]:text-muted",
        danger &&
          "text-danger data-highlighted:bg-danger-soft data-highlighted:text-danger [&_svg]:text-danger",
      )}
    >
      <span className="flex items-center gap-2">
        {icon}
        {children}
      </span>
      {hint && <kbd className="font-sans text-[11.5px] text-muted">{hint}</kbd>}
    </ContextMenu.Item>
  );
}

export function IndexMenuSeparator() {
  return <ContextMenu.Separator className="mx-1 my-1 h-px bg-line" />;
}
