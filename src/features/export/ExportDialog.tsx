import { CircleAlert, CircleCheck, ExternalLink, FolderOpen } from "lucide-react";
import { Modal } from "@/components/layout/Modal";
import { Button } from "@/components/ui/button";
import { useExportDialog } from "@/features/export/exportDialogStore";
import { showError } from "@/features/notices/noticeStore";
import { exportService, type ExportFormat } from "@/services/tauri/export";
import { toAppError } from "@/types/document";

const KIND: Record<ExportFormat, { name: string; open: string }> = {
  pdf: { name: "PDF", open: "Open PDF" },
  docx: { name: "Word", open: "Open document" },
  html: { name: "HTML", open: "Open page" },
};

/** Export progress, then Open / Show in folder when the file is ready. */
export function ExportDialog() {
  const state = useExportDialog((s) => s.state);
  const close = useExportDialog((s) => s.close);
  if (state.phase === "closed") return null;
  const kind = KIND[state.format];

  if (state.phase === "working") {
    return (
      <Modal open title={`Exporting ${kind.name}…`} description={state.name}>
        <div
          role="progressbar"
          aria-label={`Exporting ${kind.name}`}
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-sunken"
        >
          <div className="h-full w-1/3 animate-indeterminate rounded-full bg-accent" />
        </div>
        <p role="status" className="mt-2 text-[12.5px] text-text-2">
          {state.stage === "converting" ? "Converting the document…" : "Saving the file…"}
        </p>
      </Modal>
    );
  }

  if (state.phase === "error") {
    return (
      <Modal
        open
        onOpenChange={(next) => !next && close()}
        title="Export failed"
        footer={<Button onClick={close}>Close</Button>}
      >
        <p role="alert" className="mt-3 flex gap-2 text-[13px] text-danger">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      </Modal>
    );
  }

  const { result } = state;
  const run = (action: () => Promise<void>) => () =>
    void action()
      .then(close)
      .catch((e) => showError(toAppError(e).message));

  return (
    <Modal
      open
      onOpenChange={(next) => !next && close()}
      title="Export complete"
      description={
        <span className="flex items-start gap-2">
          <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
          <span>
            <strong className="font-medium text-text">{result.name}</strong> was saved to{" "}
            <span className="break-all">{result.folder}</span>.
          </span>
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Done
          </Button>
          <Button
            variant="secondary"
            onClick={run(() => exportService.revealExported(result.path))}
          >
            <FolderOpen />
            Show in folder
          </Button>
          <Button autoFocus onClick={run(() => exportService.openExported(result.path))}>
            <ExternalLink />
            {kind.open}
          </Button>
        </>
      }
    />
  );
}
