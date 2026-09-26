import { Copy, Ellipsis, Pencil, Save, SaveAll, Trash2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isDirty, type OpenDocument } from "@/features/documents/documentsStore";
import { stem } from "@/features/library/libraryModel";
import { showError } from "@/features/notices/noticeStore";
import { STAGES, useUiStore } from "@/features/ui/uiStore";
import { cn } from "@/lib/utils";

const menuItem =
  "flex h-8 cursor-pointer items-center justify-between gap-6 rounded-md px-2 text-[13px] text-text-2 outline-none data-disabled:pointer-events-none data-disabled:opacity-45 data-highlighted:bg-accent-soft data-highlighted:text-text [&_svg]:size-4 [&_svg]:text-muted";

function MenuItem({
  icon,
  hint,
  danger,
  disabled,
  onSelect,
  children,
}: {
  icon: ReactNode;
  hint?: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        menuItem,
        danger &&
          "text-danger data-highlighted:bg-danger-soft data-highlighted:text-danger [&_svg]:text-danger",
      )}
    >
      <span className="flex items-center gap-2">
        {icon}
        {children}
      </span>
      {hint && <kbd className="font-sans text-[11.5px] text-muted">{hint}</kbd>}
    </DropdownMenu.Item>
  );
}

function SaveState({ doc }: { doc: OpenDocument }) {
  if (doc.saveState === "saving") return <span className="text-muted">Saving…</span>;
  if (doc.saveState === "error") return <span className="text-danger">Not saved</span>;
  if (isDirty(doc))
    return (
      <span className="flex items-center gap-1.5 text-text-2">
        <span aria-hidden className="size-1.5 rounded-full bg-warning" />
        Unsaved
      </span>
    );
  return <span className="text-muted">Saved</span>;
}

interface StageBarProps {
  doc: OpenDocument;
  /** Where the document lives: `notes / auth-flow.md`, or its full path. */
  location: string;
  onSave: () => void;
  onSaveAs: () => void;
  onRename: () => void;
  onDelete: () => void;
}

/** Document header: name and place, the Write · Proof · Deliver stages, and document actions. */
export function StageBar({ doc, location, onSave, onSaveAs, onRename, onDelete }: StageBarProps) {
  const stage = useUiStore((s) => s.stage);
  const setStage = useUiStore((s) => s.setStage);
  const dirty = isDirty(doc);

  const copyPath = () => {
    navigator.clipboard
      ?.writeText(doc.path)
      .catch(() => showError("Couldn't copy the path to the clipboard."));
  };

  return (
    <header className="flex h-[52px] shrink-0 items-center gap-4 border-b border-line bg-canvas px-4">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[14.5px] leading-tight font-semibold text-text">
          {stem(doc.name)}
        </h1>
        <div className="flex min-w-0 items-center gap-2 text-[12px] leading-tight">
          <span className="truncate text-muted" title={doc.path}>
            {location}
          </span>
          <span aria-hidden className="text-line-strong">
            ·
          </span>
          <span role="status" className="shrink-0">
            <SaveState doc={doc} />
          </span>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Stage"
        className="flex h-8 shrink-0 items-center rounded-lg border border-line bg-panel p-0.5"
      >
        {STAGES.map(({ stage: value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={stage === value}
            onClick={() => setStage(value)}
            className={cn(
              "h-full rounded-md px-3.5 text-[13px] font-medium text-muted transition-colors duration-150 hover:text-text",
              stage === value && "bg-raised text-text shadow-[0_1px_2px_rgb(0_0_0/0.18)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 justify-end">
        <DropdownMenu.Root>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu.Trigger
                aria-label="Document actions"
                className="flex size-8 items-center justify-center rounded-md text-muted transition-colors outline-none hover:bg-raised hover:text-text data-[state=open]:bg-raised data-[state=open]:text-text"
              >
                <Ellipsis className="size-4" />
              </DropdownMenu.Trigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Document actions</TooltipContent>
          </Tooltip>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 w-[230px] rounded-lg border border-line bg-raised p-1 shadow-float"
            >
              <MenuItem icon={<Save />} hint="Ctrl S" disabled={!dirty} onSelect={onSave}>
                Save
              </MenuItem>
              <MenuItem icon={<SaveAll />} hint="Ctrl Shift S" onSelect={onSaveAs}>
                Save as…
              </MenuItem>
              <MenuItem icon={<Pencil />} hint="F2" onSelect={onRename}>
                Rename
              </MenuItem>
              <MenuItem icon={<Copy />} onSelect={copyPath}>
                Copy path
              </MenuItem>
              <DropdownMenu.Separator className="mx-1 my-1 h-px bg-line" />
              <MenuItem icon={<Trash2 />} danger onSelect={onDelete}>
                Move to trash
              </MenuItem>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
