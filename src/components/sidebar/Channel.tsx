import { Copy, ExternalLink, Hash, Pencil } from "lucide-react";
import { ContextMenu } from "radix-ui";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { stem } from "@/features/library/libraryModel";
import { showError } from "@/features/notices/noticeStore";
import { useUiStore } from "@/features/ui/uiStore";
import { cn } from "@/lib/utils";

const rowClass =
  "relative flex h-[34px] w-full items-center gap-1.5 rounded-md px-2 text-left text-base font-medium";

function MenuItem({
  icon,
  hint,
  children,
  onSelect,
}: {
  icon: ReactNode;
  hint?: string;
  children: ReactNode;
  onSelect: () => void;
}) {
  return (
    <ContextMenu.Item
      onSelect={onSelect}
      className="flex h-8 cursor-pointer items-center justify-between gap-4 rounded-sm px-2 text-sm font-medium text-interactive-normal outline-none data-highlighted:bg-primary data-highlighted:text-white [&_svg]:size-4"
    >
      <span className="flex items-center gap-2">
        {icon}
        {children}
      </span>
      {hint && <span className="text-xs opacity-70">{hint}</span>}
    </ContextMenu.Item>
  );
}

/** Inline name editor (Discord "Edit Channel" name, done in place). */
function RenameField({ path, fileName }: { path: string; fileName: string }) {
  const { renameDocument } = useDocumentCommands();
  const setRenamingPath = useUiStore((s) => s.setRenamingPath);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const current = stem(fileName);

  const finish = async (value: string) => {
    if (submitting.current) return;
    const next = value.trim();
    if (!next || next === current) {
      setRenamingPath(null);
      return;
    }
    submitting.current = true;
    try {
      await renameDocument(path, next);
      setRenamingPath(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      submitting.current = false;
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === "Enter") void finish(event.currentTarget.value);
    if (event.key === "Escape") setRenamingPath(null);
  };

  return (
    <div>
      <div className={cn(rowClass, "bg-surface-selected")}>
        <Hash className="size-5 shrink-0 text-channel-default" />
        <input
          autoFocus
          defaultValue={current}
          aria-label="Document name"
          aria-invalid={error !== null}
          onFocus={(e) => e.currentTarget.select()}
          onChange={() => setError(null)}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            // Keep the field open while an error is shown so it can be fixed.
            if (!error) void finish(e.currentTarget.value);
          }}
          className="h-6 min-w-0 flex-1 rounded-[3px] bg-surface-tertiary px-1.5 text-base text-interactive-active outline-none aria-invalid:ring-1 aria-invalid:ring-destructive"
        />
      </div>
      {error && (
        <p role="alert" className="px-2 pt-1 pb-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

interface ChannelProps {
  /** Full file name, e.g. `auth-flow.md` (shown without the extension). */
  fileName: string;
  path: string;
  /** Hover title, e.g. the path relative to the library. */
  title: string;
  active: boolean;
  unsaved: boolean;
  onOpen: () => void;
}

/**
 * A document row, styled like a Discord text channel. Unsaved = bold + dot (like unread).
 * Right-click for Rename / Copy path; F2 renames the open document.
 */
export function Channel({ fileName, path, title, active, unsaved, onOpen }: ChannelProps) {
  const renaming = useUiStore((s) => s.renamingPath === path);
  const setRenamingPath = useUiStore((s) => s.setRenamingPath);
  const name = stem(fileName);

  if (renaming) return <RenameField path={path} fileName={fileName} />;

  const copyPath = () => {
    navigator.clipboard
      ?.writeText(path)
      .catch(() => showError("Couldn't copy the path to the clipboard."));
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <button
          type="button"
          title={title}
          aria-current={active ? "page" : undefined}
          aria-label={unsaved ? `${name} (unsaved changes)` : name}
          onClick={onOpen}
          className={cn(
            rowClass,
            "text-channel-default transition-colors hover:bg-surface-hover hover:text-interactive-hover data-[state=open]:bg-surface-hover",
            unsaved && "text-interactive-active",
            active && "bg-surface-selected text-interactive-active",
          )}
        >
          {unsaved && !active && (
            <span
              aria-hidden
              className="absolute -left-2 h-2 w-1 rounded-r-full bg-header-primary"
            />
          )}
          <Hash className="size-5 shrink-0 text-channel-default" />
          <span className="truncate">{name}</span>
          {unsaved && (
            <span aria-hidden className="ml-auto size-2 shrink-0 rounded-full bg-header-primary" />
          )}
        </button>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="z-50 w-[200px] rounded-md bg-surface-floating p-1.5 shadow-elevation-high">
          <MenuItem icon={<ExternalLink />} onSelect={onOpen}>
            Open
          </MenuItem>
          <MenuItem icon={<Pencil />} hint="F2" onSelect={() => setRenamingPath(path)}>
            Rename
          </MenuItem>
          <ContextMenu.Separator className="mx-1 my-1 h-px bg-surface-selected" />
          <MenuItem icon={<Copy />} onSelect={copyPath}>
            Copy path
          </MenuItem>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
