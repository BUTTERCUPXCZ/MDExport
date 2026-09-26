import { FileText, Folder } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";
import { refreshLibrary } from "@/features/library/libraryStore";
import { useUiStore } from "@/features/ui/uiStore";
import { useDeferredFocus } from "@/hooks/useDeferredFocus";
import { libraryService } from "@/services/tauri/library";
import { toAppError } from "@/types/document";

/**
 * Inline name field for a new document or folder, shown in the tree where it
 * will appear (like VS Code's explorer). Enter or clicking away creates it,
 * Esc or an empty name cancels, errors stay visible to fix.
 */
export function CreateField({
  kind,
  parent,
  indent,
}: {
  kind: "document" | "folder";
  parent: string;
  indent: number;
}) {
  const { createNamedDocument } = useDocumentCommands();
  const cancel = useUiStore((s) => s.cancelCreating);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const { ref, ready } = useDeferredFocus<HTMLInputElement>();
  const Icon = kind === "document" ? FileText : Folder;

  const finish = async (value: string) => {
    const name = value.trim();
    if (!name) return cancel();
    if (submitting.current) return;
    submitting.current = true;
    try {
      if (kind === "document") await createNamedDocument(parent, name);
      else {
        await libraryService.createFolder(name, parent);
        await refreshLibrary();
      }
      cancel();
    } catch (e) {
      setError(e instanceof Error ? e.message : toAppError(e).message);
    } finally {
      submitting.current = false;
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (event.key === "Enter") void finish(event.currentTarget.value);
    if (event.key === "Escape") cancel();
  };

  return (
    <div style={{ paddingLeft: indent }} className="py-0.5">
      <div className="flex items-center gap-2">
        <Icon aria-hidden className="size-3.5 shrink-0 text-accent" />
        <input
          ref={ref}
          aria-label={kind === "document" ? "New document name" : "New folder name"}
          aria-invalid={error !== null}
          placeholder={kind === "document" ? "Document name" : "Folder name"}
          maxLength={64}
          onChange={() => setError(null)}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            // Ignore focus moving before the field got it (a closing menu);
            // keep the field while an error is shown so it can be fixed.
            if (ready.current && !error) void finish(e.currentTarget.value);
          }}
          className="h-[28px] min-w-0 flex-1 rounded-md border border-accent bg-canvas px-2 text-[13.5px] text-text outline-none placeholder:text-muted aria-invalid:border-danger"
        />
      </div>
      {error && (
        <p role="alert" className="pt-1 pb-1 pl-5.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
