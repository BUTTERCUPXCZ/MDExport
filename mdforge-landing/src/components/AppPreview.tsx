import { useState } from "react";
import { AppWindow, Shot, STAGES, type Stage } from "@/mocks/AppMocks";
import { cn } from "@/lib/utils";

const LABEL: Record<Stage, string> = {
  write: "the Markdown editor",
  proof: "the Markdown editor beside the rendered page",
  deliver: "the rendered page beside the export panel",
};

/** The full MDForge window at one stage, framed. Phones scroll it sideways at a readable size. */
export function AppPreview({ stage }: { stage: Stage }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-line-strong">
      <div className="min-w-[760px]">
        <Shot label={`The MDForge window in the ${stage} stage: library on the left, ${LABEL[stage]}.`}>
          <AppWindow stage={stage} />
        </Shot>
      </div>
    </div>
  );
}

/** The window plus Write / Proof / Deliver buttons that switch it. */
export function StageDemo({ captions }: { captions: Record<Stage, string> }) {
  const [stage, setStage] = useState<Stage>("proof");

  return (
    <div>
      <AppPreview stage={stage} />
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          role="group"
          aria-label="Show stage"
          className="flex w-fit rounded-[10px] border border-line bg-panel p-1"
        >
          {STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={stage === s.id}
              onClick={() => setStage(s.id)}
              className={cn(
                "h-9 rounded-md px-4 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-text",
                stage === s.id && "bg-raised text-text shadow-[0_1px_2px_rgb(0_0_0/0.25)]",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="text-[15px] text-text-2">
          {captions[stage]}
        </p>
      </div>
    </div>
  );
}
