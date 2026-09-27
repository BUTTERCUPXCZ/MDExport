import { ArrowDownToLine, LoaderCircle } from "lucide-react";
import { useUpdateStore } from "@/features/updates/updateStore";

/**
 * "Update to vX" in the library footer while an update is available, so it
 * stays in reach after the dialog is closed with "Later". Shows progress while installing.
 */
export function UpdateBadge() {
  const status = useUpdateStore((s) => s.status);
  const version = useUpdateStore((s) => s.info?.version);
  const progress = useUpdateStore((s) => s.progress);
  const openDialog = useUpdateStore((s) => s.openDialog);

  if (status === "installing") {
    return (
      <span role="status" className="flex items-center gap-1.5 px-2 text-[12.5px] text-muted">
        <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
        {progress === null ? "Updating…" : `Updating… ${Math.round(progress * 100)}%`}
      </span>
    );
  }
  if (status !== "available" || !version) return null;

  return (
    <button
      type="button"
      onClick={openDialog}
      className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[12.5px] font-medium text-accent transition-colors hover:bg-accent-soft"
    >
      <ArrowDownToLine aria-hidden className="size-3.5" />
      Update to v{version}
    </button>
  );
}
