import { useParams } from "@tanstack/react-router";
import { Copy, Minus, Square, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useOpenDocument } from "@/features/documents/documentsStore";
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
        "flex h-full w-[46px] items-center justify-center text-interactive-normal transition-colors [&_svg]:size-4",
        danger
          ? "hover:bg-destructive hover:text-white"
          : "hover:bg-surface-hover hover:text-interactive-hover",
      )}
    >
      {children}
    </button>
  );
}

/** What the window is showing, for the centre of the title bar. */
function useContextLabel(): string | null {
  const { documentId, folder } = useParams({ strict: false });
  const doc = useOpenDocument(documentId ?? "");
  if (doc) return stem(doc.name);
  if (folder) return folder;
  return null;
}

/**
 * Discord-style window title bar (the system one is turned off in tauri.conf.json).
 * Drag it to move the window, double-click to maximize. Same color as the rail,
 * so it blends into the app.
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
      className="flex h-[30px] shrink-0 items-center bg-surface-tertiary select-none"
    >
      <div data-tauri-drag-region className="flex items-center gap-2 pl-3">
        <span
          data-tauri-drag-region
          className="flex size-[18px] items-center justify-center rounded-md bg-primary text-[9px] font-extrabold text-white"
        >
          MD
        </span>
        <span data-tauri-drag-region className="text-xs font-bold text-header-secondary">
          MDForge
        </span>
      </div>

      <div
        data-tauri-drag-region
        className="min-w-0 flex-1 truncate px-4 text-center text-xs font-semibold text-text-muted"
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
