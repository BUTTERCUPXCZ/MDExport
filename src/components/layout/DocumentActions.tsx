import { FileDown, Save } from "lucide-react";
import { ComingSoon } from "@/components/layout/ComingSoon";

const iconButton =
  "text-interactive-normal flex size-6 items-center justify-center opacity-50 [&_svg]:size-5";

/** Save / Export toolbar buttons. Wired up in Phase 4 (save) and Phase 13–14 (export). */
export function DocumentActions() {
  return (
    <>
      <ComingSoon label="Save (Ctrl+S) — coming soon">
        <button type="button" disabled aria-label="Save" className={iconButton}>
          <Save />
        </button>
      </ComingSoon>
      <ComingSoon label="Export — coming soon">
        <button type="button" disabled aria-label="Export" className={iconButton}>
          <FileDown />
        </button>
      </ComingSoon>
    </>
  );
}
