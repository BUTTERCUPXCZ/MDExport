import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OpenDocument } from "@/features/documents/documentsStore";
import { EXPORT_FORMATS, useExport } from "@/features/export/useExport";
import { stem } from "@/features/library/libraryModel";
import { useUiStore } from "@/features/ui/uiStore";
import { cn } from "@/lib/utils";

const NOTES: Record<string, string> = {
  pdf: "A4 pages, ready to share or print.",
  docx: "Editable in Word, Google Docs or Pages.",
  html: "One self-contained web page.",
};

/** Deliver stage: pick a format beside the finished page and export it. */
export function DeliverPanel({ doc }: { doc: OpenDocument }) {
  const format = useUiStore((s) => s.exportFormat);
  const setFormat = useUiStore((s) => s.setExportFormat);
  const exporting = useUiStore((s) => s.exporting);
  const runExport = useExport();
  const chosen = EXPORT_FORMATS.find((f) => f.format === format) ?? EXPORT_FORMATS[0];

  return (
    <aside
      aria-label="Export"
      className="flex w-[300px] shrink-0 flex-col border-l border-line bg-panel px-5 py-5"
    >
      <h2 className="text-[15px] font-semibold text-text">Export</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-text-2">
        The page on the left is what you get. Unsaved edits are included.
      </p>

      <fieldset className="mt-5">
        <legend className="mb-2 text-[12px] font-medium text-muted">Format</legend>
        <div className="flex flex-col gap-1.5">
          {EXPORT_FORMATS.map((option) => {
            const selected = option.format === format;
            return (
              <label
                key={option.format}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors duration-150",
                  selected
                    ? "border-accent bg-accent-soft"
                    : "border-line bg-canvas hover:border-line-strong",
                )}
              >
                <input
                  type="radio"
                  name="export-format"
                  value={option.format}
                  checked={selected}
                  onChange={() => setFormat(option.format)}
                  className="mt-0.5 accent-(--accent)"
                />
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2 text-[13.5px] font-medium text-text">
                    {option.label}
                    <span className="font-mono text-[11.5px] font-normal text-muted">
                      {option.extension}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-text-2">
                    {NOTES[option.format]}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Button
        size="lg"
        className="mt-5 w-full"
        disabled={exporting !== null}
        onClick={() => void runExport(doc, chosen.format)}
      >
        {exporting ? <LoaderCircle className="animate-spin" /> : <Download />}
        {exporting ? "Exporting…" : `Export ${chosen.label.split(" ")[0]}`}
      </Button>
      <p className="mt-2 truncate text-center text-[12px] text-muted">
        Saves as {stem(doc.name)}
        {chosen.extension}
      </p>
    </aside>
  );
}
