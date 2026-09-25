import { FileCode2, FileDown, FileText, FileType2, LoaderCircle } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { OpenDocument } from "@/features/documents/documentsStore";
import { EXPORT_FORMATS, useExport } from "@/features/export/useExport";
import { useUiStore } from "@/features/ui/uiStore";
import type { ExportFormat } from "@/services/tauri/export";

const ICONS: Record<ExportFormat, ReactNode> = {
  pdf: <FileText />,
  docx: <FileType2 />,
  html: <FileCode2 />,
};

/** Editor header "Export" dropdown (Ctrl+E opens it). */
export function ExportMenu({ doc }: { doc: OpenDocument }) {
  const open = useUiStore((s) => s.exportMenuOpen);
  const setOpen = useUiStore((s) => s.setExportMenuOpen);
  const exporting = useUiStore((s) => s.exporting);
  const exportDocument = useExport();

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu.Trigger
            aria-label={exporting ? "Exporting…" : "Export"}
            disabled={exporting !== null}
            className="flex h-6 items-center gap-1 rounded-sm px-1 text-sm font-medium text-interactive-normal transition-colors outline-none hover:text-interactive-hover disabled:opacity-60 data-[state=open]:text-interactive-active [&_svg]:size-5"
          >
            {exporting ? <LoaderCircle className="animate-spin" /> : <FileDown />}
            <span>Export</span>
          </DropdownMenu.Trigger>
        </TooltipTrigger>
        <TooltipContent>Export (Ctrl+E)</TooltipContent>
      </Tooltip>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[240px] rounded-md bg-surface-floating p-1.5 shadow-elevation-high"
        >
          <DropdownMenu.Label className="px-2 pt-1 pb-1.5 text-xs font-bold tracking-wide text-header-secondary uppercase">
            Export as
          </DropdownMenu.Label>
          {EXPORT_FORMATS.map(({ format, label, extension }) => (
            <DropdownMenu.Item
              key={format}
              onSelect={() => void exportDocument(doc, format)}
              className="flex h-9 cursor-pointer items-center gap-2 rounded-sm px-2 text-sm font-medium text-interactive-normal outline-none data-highlighted:bg-primary data-highlighted:text-white [&_svg]:size-4"
            >
              {ICONS[format]}
              <span className="flex-1">{label}</span>
              <span className="text-xs opacity-70">{extension}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
