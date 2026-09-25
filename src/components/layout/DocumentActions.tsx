import { FileDown, Save } from "lucide-react";
import { ComingSoon } from "@/components/layout/ComingSoon";

const iconButton =
  "text-interactive-normal flex size-6 items-center justify-center opacity-50 [&_svg]:size-5";

/** Disabled Save / Export placeholders for pages without an open document. */
export function DocumentActions() {
  return (
    <>
      <ComingSoon label="Open a document to save it">
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
