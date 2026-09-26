import { Copy, ExternalLink, FilePlus2, FileText, FolderPlus, Pencil, Trash2 } from "lucide-react";
import { ContextMenu } from "radix-ui";
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import {
  IndexMenuContent,
  IndexMenuItem,
  IndexMenuSeparator,
} from "@/components/library-index/IndexMenu";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { stem } from "@/features/library/libraryModel";
import { showError } from "@/features/notices/noticeStore";
import { useUiStore } from "@/features/ui/uiStore";
import { useDeferredFocus } from "@/hooks/useDeferredFocus";
import { cn } from "@/lib/utils";

const rowClass =
  "relative flex h-[30px] w-full items-center gap-2 rounded-md pr-2 text-left text-[13.5px]";

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
  const { ref, ready } = useDeferredFocus<HTMLInputElement>();
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
        ref={ref}
        defaultValue={current}
        aria-label="Document name"
        aria-invalid={error !== null}

        onChange={() => setError(null)}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          // Ignore focus moving before the field got it (a closing menu);
          // keep the field open while an error is shown so it can be fixed.
          if (ready.current && !error) void finish(e.currentTarget.value);
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
  /** Asks to move the document to the trash (confirmation is up to the caller). */
  onTrash?: () => void;
  /** Library folder the document is in (`""` = root); enables "New … here". */
  folder?: string;
}

/** A document in the library index. Right-click for Open / Rename / Copy path / Move to trash; F2 renames. */
export function DocumentRow({
  fileName,
  path,
  title,
  age,
  active,
  unsaved,
  indent = 8,
  onOpen,
  onTrash,
  folder,
}: DocumentRowProps) {
  const renaming = useUiStore((s) => s.renamingPath === path);
  const setRenamingPath = useUiStore((s) => s.setRenamingPath);
  const startCreating = useUiStore((s) => s.startCreating);
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
      <IndexMenuContent>
        <IndexMenuItem icon={<ExternalLink />} onSelect={onOpen}>
          Open
        </IndexMenuItem>
        <IndexMenuItem icon={<Pencil />} hint="F2" onSelect={() => setRenamingPath(path)}>
          Rename
        </IndexMenuItem>
        <IndexMenuItem icon={<Copy />} onSelect={copyPath}>
          Copy path
        </IndexMenuItem>
        {folder !== undefined && (
          <>
            <IndexMenuSeparator />
            <IndexMenuItem icon={<FilePlus2 />} onSelect={() => startCreating("document", folder)}>
              New document here
            </IndexMenuItem>
            <IndexMenuItem icon={<FolderPlus />} onSelect={() => startCreating("folder", folder)}>
              New folder here
            </IndexMenuItem>
          </>
        )}
        {onTrash && (
          <>
            <IndexMenuSeparator />
            <IndexMenuItem icon={<Trash2 />} danger onSelect={onTrash}>
              Move to trash
            </IndexMenuItem>
          </>
        )}
      </IndexMenuContent>
    </ContextMenu.Root>
  );
}
