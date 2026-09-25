import { Modal } from "@/components/layout/Modal";
import { Button } from "@/components/ui/button";

interface ConflictDialogProps {
  open: boolean;
  fileName: string;
  onCancel: () => void;
  onOverwrite: () => void;
  onReload: () => void;
  onSaveCopy: () => void;
}

const OPTIONS = [
  ["Reload from disk", "Discards your unsaved changes."],
  ["Save as copy", "Keeps both versions."],
  ["Overwrite", "Replaces the other changes with yours."],
] as const;

/** Shown when a save is refused because the file changed outside MDForge. */
export function ConflictDialog({
  open,
  fileName,
  onCancel,
  onOverwrite,
  onReload,
  onSaveCopy,
}: ConflictDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && onCancel()}
      size="wide"
      label="Conflict"
      title="File changed on disk"
      description={
        <>
          <span className="font-mono text-[13px] text-ink">{fileName}</span> was modified outside
          MDForge after you opened it. Choose which version to keep.
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={onReload}>
            Reload from disk
          </Button>
          <Button variant="secondary" onClick={onSaveCopy}>
            Save as copy
          </Button>
          <Button variant="danger" onClick={onOverwrite}>
            Overwrite
          </Button>
        </>
      }
    >
      <dl className="grid grid-cols-[10rem_1fr] border-t pt-3 text-[13px]">
        {OPTIONS.map(([name, effect]) => (
          <div key={name} className="contents">
            <dt className="py-1 font-mono text-[11px] tracking-[0.06em] text-ink uppercase">
              {name}
            </dt>
            <dd className="py-1 text-ink-2">{effect}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
