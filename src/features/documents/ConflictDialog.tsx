import { Modal, ModalCancel } from "@/components/layout/Modal";
import { Button } from "@/components/ui/button";

interface ConflictDialogProps {
  open: boolean;
  fileName: string;
  onCancel: () => void;
  onOverwrite: () => void;
  onReload: () => void;
  onSaveCopy: () => void;
}

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
      title="File changed on disk"
      description={
        <>
          <strong className="text-header-primary">{fileName}</strong> was modified outside MDForge
          after you opened it. Choose which version to keep.
        </>
      }
      footer={
        <>
          <ModalCancel onClick={onCancel} />
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
      <ul className="list-disc space-y-1 pt-1 pl-5 text-sm text-text-muted">
        <li>
          <b className="text-text-normal">Reload from disk</b> discards your unsaved changes.
        </li>
        <li>
          <b className="text-text-normal">Save as copy</b> keeps both versions.
        </li>
        <li>
          <b className="text-text-normal">Overwrite</b> replaces the other changes with yours.
        </li>
      </ul>
    </Modal>
  );
}
