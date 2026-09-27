import { ExternalLink, LoaderCircle } from "lucide-react";
import { Modal } from "@/components/layout/Modal";
import { Button } from "@/components/ui/button";
import { useUpdateStore } from "@/features/updates/updateStore";
import { openerService } from "@/services/tauri/opener";
import { releaseUrl } from "@/services/tauri/updater";

/** Pops up when a new release is out: update now, later, or skip this version. */
export function UpdateDialog() {
  const { dialogOpen, status, info, progress, install, closeDialog, skipVersion } =
    useUpdateStore();
  const installing = status === "installing";
  if (!info) return null;

  return (
    <Modal
      open={dialogOpen && (status === "available" || installing)}
      // Can't be dismissed while the update downloads; the app restarts after.
      onOpenChange={installing ? undefined : (next) => !next && closeDialog()}
      title={`MDExport v${info.version} is available`}
      description={
        <>
          You have v{info.currentVersion}. Your open documents are saved before MDExport restarts on
          the new version.
        </>
      }
      footer={
        <>
          <Button variant="ghost" disabled={installing} onClick={skipVersion}>
            Skip this version
          </Button>
          <Button variant="ghost" disabled={installing} onClick={closeDialog}>
            Later
          </Button>
          <Button disabled={installing} onClick={() => void install()}>
            {installing && <LoaderCircle className="animate-spin" />}
            {installing ? "Updating…" : "Update now"}
          </Button>
        </>
      }
    >
      <div className="mt-3 flex items-center justify-between gap-4 text-[13px]">
        <button
          type="button"
          onClick={() => void openerService.openExternal(releaseUrl(info.version)).catch(() => {})}
          className="inline-flex items-center gap-1.5 text-accent hover:underline"
        >
          What's new
          <ExternalLink aria-hidden className="size-3.5" />
        </button>
        {installing && (
          <span role="status" className="text-text-2 tabular-nums">
            {progress === null ? "Downloading…" : `Downloading… ${Math.round(progress * 100)}%`}
          </span>
        )}
      </div>
    </Modal>
  );
}
