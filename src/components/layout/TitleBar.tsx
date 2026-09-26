import { Copy, Minus, Square, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useActiveDocument } from "@/features/documents/useActiveDocument";
import { stem } from "@/features/library/libraryModel";
import { cn } from "@/lib/utils";
import { windowService } from "@/services/tauri/window";

function WindowButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-full w-[46px] items-center justify-center text-muted transition-colors duration-150 [&_svg]:size-4",
        danger ? "hover:bg-[#c42b1c] hover:text-white" : "hover:bg-raised hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

/** What the window is showing, for the centre of the title bar. */
function useContextLabel(): string | null {
  const doc = useActiveDocument();
  return doc ? stem(doc.name) : null;
}

/**
 * Window title bar (the system one is turned off in tauri.conf.json).
 * Drag it to move the window, double-click to maximize. Same color as the
 * library index, so the two read as one column.
 */
export function TitleBar() {
  const [maximized, setMaximized] = useState(false);
  const context = useContextLabel();

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let active = true;
    const sync = () =>
      windowService.isMaximized().then(
        (value) => active && setMaximized(value),
        () => {},
      );
    sync();
    windowService.onResized(sync).then(
      (stop) => (active ? (unlisten = stop) : stop()),
      () => {},
    );
    return () => {
      active = false;
      unlisten?.();
    };
  }, []);

  const run = (action: () => Promise<void>) => () => void action().catch(() => {});

  return (
    <header
      data-tauri-drag-region
      className="flex h-[32px] shrink-0 items-center border-b border-line bg-panel select-none"
    >
      <div data-tauri-drag-region className="flex items-center gap-2 pl-3">
        <span data-tauri-drag-region className="text-[12.5px] font-semibold text-text-2">
          MDForge
        </span>
      </div>

      <div
        data-tauri-drag-region
        className="min-w-0 flex-1 truncate px-4 text-center text-[12.5px] text-muted"
      >
        {context}
      </div>

      <div className="flex h-full" role="group" aria-label="Window controls">
        <WindowButton label="Minimize" onClick={run(windowService.minimize)}>
          <Minus />
        </WindowButton>
        <WindowButton
          label={maximized ? "Restore" : "Maximize"}
          onClick={run(windowService.toggleMaximize)}
        >
          {maximized ? <Copy className="-scale-x-100" /> : <Square className="size-3.5!" />}
        </WindowButton>
        <WindowButton label="Close" danger onClick={run(windowService.close)}>
          <X />
        </WindowButton>
      </div>
    </header>
  );
}
