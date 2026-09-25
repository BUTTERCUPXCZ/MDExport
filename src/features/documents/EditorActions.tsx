import { Save, SaveAll, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className="flex size-6 items-center justify-center text-interactive-normal transition-colors hover:text-interactive-hover disabled:opacity-50 [&_svg]:size-5"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

interface EditorActionsProps {
  canSave: boolean;
  onSave: () => void;
  onSaveAs: () => void;
  onDelete: () => void;
}

export function EditorActions({ canSave, onSave, onSaveAs, onDelete }: EditorActionsProps) {
  return (
    <>
      <IconAction label="Save (Ctrl+S)" onClick={onSave} disabled={!canSave}>
        <Save />
      </IconAction>
      <IconAction label="Save As (Ctrl+Shift+S)" onClick={onSaveAs}>
        <SaveAll />
      </IconAction>
      <IconAction label="Move to trash" onClick={onDelete}>
        <Trash2 />
      </IconAction>
    </>
  );
}
