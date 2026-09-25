import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Text button for page header toolbars: mono caps, shortcut hint after the label. */
export function HeaderAction({
  children,
  shortcut,
  className,
  ...props
}: ComponentProps<"button"> & { shortcut?: ReactNode }) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-7 items-center gap-1.5 px-2 font-mono text-[11px] font-medium tracking-[0.06em] text-ink-2 uppercase transition-colors hover:bg-surface hover:text-ink disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
      {shortcut && (
        <>
          {" "}
          <kbd className="font-normal tracking-normal text-ink-3 normal-case">{shortcut}</kbd>
        </>
      )}
    </button>
  );
}
