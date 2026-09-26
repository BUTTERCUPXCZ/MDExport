import { useState } from "react";
import { Modal, ModalCancel } from "@/components/layout/Modal";
import { Button } from "@/components/ui/button";

interface DeleteFolderDialogProps {
  open: boolean;
  /** Folder name as shown in the index. */
  name: string;
  /** Documents in the folder and its subfolders. */
  documents: number;
  /** Open documents inside it with unsaved changes (they will be lost). */
  unsaved: number;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function DeleteFolderDialog({
  open,
  name,
  documents,
  unsaved,
  onCancel,
  onConfirm,
}: DeleteFolderDialogProps) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  const contents =
    documents === 0
      ? "The folder is empty."
      : `It contains ${plural(documents, "document")}, which move with it.`;

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && !busy && onCancel()}
      title={`Move “${name}” to trash?`}
      description={`${contents} You can restore it from your system trash.`}
      footer={
        <>
          <ModalCancel onClick={onCancel} />
          <Button variant="danger" disabled={busy} onClick={() => void confirm()}>
            Move to trash
          </Button>
        </>
      }
    >
      {unsaved > 0 && (
        <p
          role="alert"
          className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger"
        >
          Unsaved changes in {plural(unsaved, "open document")} will be lost.
        </p>
      )}
    </Modal>
  );
}
