import { Copy, ExternalLink, FileText, Pencil } from "lucide-react";
import { ContextMenu } from "radix-ui";
import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { stem } from "@/features/library/libraryModel";
import { showError } from "@/features/notices/noticeStore";
import { useUiStore } from "@/features/ui/uiStore";
import { cn } from "@/lib/utils";

const rowClass =
  "relative flex h-[30px] w-full items-center gap-2 rounded-md pr-2 text-left text-[13.5px]";

export const menuItemClass =
  "flex h-8 cursor-pointer items-center justify-between gap-6 rounded-md px-2 text-[13px] text-text-2 outline-none data-highlighted:bg-accent-soft data-highlighted:text-text [&_svg]:size-4 [&_svg]:text-muted";

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
    <ContextMenu.Item onSelect={onSelect} className={menuItemClass}>
      <span className="flex items-center gap-2">
        {icon}
        {children}
      </span>
      {hint && <kbd className="text-muted">{hint}</kbd>}
    </ContextMenu.Item>
  );
}

/** Inline name editor. Enter saves, Esc cancels, errors stay visible to fix. */
function RenameField({
  path,
  fileName,
  indent,
}: {
  path: string;
  fileName: string;
  indent: number;
}) {
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
    <div style={{ paddingLeft: indent }}>
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
        className="h-[30px] w-full rounded-md border border-accent bg-canvas px-2 text-[13.5px] text-text outline-none aria-invalid:border-danger"
      />
      {error && (
        <p role="alert" className="px-1 pt-1 pb-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

interface DocumentRowProps {
  /** Full file name, e.g. `auth-flow.md` (shown without the extension). */
  fileName: string;
  path: string;
  /** Hover title, e.g. the path relative to the library. */
  title: string;
  /** Right-side hint, e.g. "2h". */
  age?: string;
  active: boolean;
  unsaved: boolean;
  /** Left padding in px (nesting depth). */
  indent?: number;
  onOpen: () => void;
}

/** A document in the library index. Right-click for Open / Rename / Copy path; F2 renames. */
export function DocumentRow({
  fileName,
  path,
  title,
  age,
  active,
  unsaved,
  indent = 8,
  onOpen,
}: DocumentRowProps) {
  const renaming = useUiStore((s) => s.renamingPath === path);
  const setRenamingPath = useUiStore((s) => s.setRenamingPath);
  const name = stem(fileName);

  if (renaming) return <RenameField path={path} fileName={fileName} indent={indent} />;

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
          style={{ paddingLeft: indent } as CSSProperties}
          className={cn(
            rowClass,
            "text-text-2 transition-colors duration-150 hover:bg-raised hover:text-text data-[state=open]:bg-raised",
            active && "bg-accent-soft font-medium text-text hover:bg-accent-soft",
          )}
        >
          <FileText
            aria-hidden
            className={cn("size-3.5 shrink-0 text-muted", active && "text-accent")}
          />
          <span className="min-w-0 flex-1 truncate">{name}</span>
          {unsaved ? (
            <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-warning" />
          ) : (
            age && <span className="shrink-0 text-[11.5px] text-muted tabular-nums">{age}</span>
          )}
        </button>
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content className="z-50 w-[210px] rounded-lg border border-line bg-raised p-1 shadow-float">
          <MenuItem icon={<ExternalLink />} onSelect={onOpen}>
            Open
          </MenuItem>
          <MenuItem icon={<Pencil />} hint="F2" onSelect={() => setRenamingPath(path)}>
            Rename
          </MenuItem>
          <ContextMenu.Separator className="mx-1 my-1 h-px bg-line" />
          <MenuItem icon={<Copy />} onSelect={copyPath}>
            Copy path
          </MenuItem>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
