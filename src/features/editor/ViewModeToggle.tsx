export type ViewMode = "editor" | "split" | "preview";

const VIEW_MODES: { mode: ViewMode; label: string }[] = [
  { mode: "editor", label: "Edit" },
  { mode: "split", label: "Split" },
  { mode: "preview", label: "Preview" },
];

/** Segmented control; the active segment is inverted (ink block). */
export function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div role="group" aria-label="View mode" className="flex border">
      {VIEW_MODES.map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className="h-6 border-l px-2 font-mono text-[11px] tracking-[0.06em] text-ink-2 uppercase first:border-l-0 hover:text-ink aria-pressed:bg-ink aria-pressed:text-bg"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
