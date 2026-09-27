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

/** Shown when a save is refused because the file changed outside MDExport. */
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
          <strong className="text-text">{fileName}</strong> was modified outside MDExport after you
          opened it. Choose which version to keep.
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
      <ul className="mt-4 space-y-1.5 text-[13px] text-text-2">
        <li>
          <b className="font-medium text-text">Reload from disk</b> discards your unsaved changes.
        </li>
        <li>
          <b className="font-medium text-text">Save as copy</b> keeps both versions.
        </li>
        <li>
          <b className="font-medium text-text">Overwrite</b> replaces the other changes with yours.
        </li>
      </ul>
    </Modal>
  );
}
