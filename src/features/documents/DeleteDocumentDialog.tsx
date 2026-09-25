import { useState } from "react";
import { Modal, ModalCancel } from "@/components/layout/Modal";
import { Button } from "@/components/ui/button";

interface DeleteDocumentDialogProps {
  open: boolean;
  fileName: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteDocumentDialog({
  open,
  fileName,
  onCancel,
  onConfirm,
}: DeleteDocumentDialogProps) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={(next) => !next && !busy && onCancel()}
      title={`Move “${fileName}” to trash?`}
      description="The file will be moved to your system trash. You can restore it from there."
      footer={
        <>
          <ModalCancel onClick={onCancel} />
          <Button variant="danger" disabled={busy} onClick={() => void confirm()}>
            Move to trash
          </Button>
        </>
      }
    />
  );
}
