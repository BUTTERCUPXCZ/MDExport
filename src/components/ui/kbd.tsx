import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Keyboard shortcut hint, e.g. <Kbd>Ctrl+S</Kbd>. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "font-mono text-[10px] font-normal tracking-normal normal-case opacity-60",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
