import { Code, Columns2, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type ViewMode = "editor" | "split" | "preview";

const VIEW_MODES: { mode: ViewMode; label: string; icon: typeof Code }[] = [
  { mode: "editor", label: "Editor only", icon: Code },
  { mode: "split", label: "Split view", icon: Columns2 },
  { mode: "preview", label: "Preview only", icon: Eye },
];

export function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div role="group" aria-label="View mode" className="flex items-center gap-1">
      {VIEW_MODES.map(({ mode, label, icon: Icon }) => (
        <Tooltip key={mode}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={label}
              aria-pressed={value === mode}
              onClick={() => onChange(mode)}
              className="flex size-7 items-center justify-center rounded-md text-interactive-normal transition-colors hover:bg-surface-hover hover:text-interactive-hover aria-pressed:bg-surface-selected aria-pressed:text-interactive-active"
            >
              <Icon className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
