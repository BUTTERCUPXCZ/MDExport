import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Modal, ModalCancel } from "@/components/layout/Modal";
import { Button } from "@/components/ui/button";
import { isDirty, useDocumentsStore } from "@/features/documents/documentsStore";
import { stem } from "@/features/library/libraryModel";
import { saveAll } from "@/features/session/useCloseGuard";
import { useUiStore } from "@/features/ui/uiStore";
import { windowService } from "@/services/tauri/window";

/** Shown when closing the window while documents still have unsaved changes. */
export function CloseGuardDialog() {
  const open = useUiStore((s) => s.closeGuardOpen);
  const setOpen = useUiStore((s) => s.setCloseGuardOpen);
  const names = useDocumentsStore(
    useShallow((s) =>
      Object.values(s.documents)
        .filter(isDirty)
        .map((d) => stem(d.name)),
    ),
  );
  const [busy, setBusy] = useState(false);

  const close = () => void windowService.destroy().catch(() => {});

  const saveAndClose = async () => {
    setBusy(true);
    try {
      if (await saveAll()) close();
      // A failed save or a conflict explains itself; let the user deal with it.
      else setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open && names.length > 0}
      onOpenChange={(next) => !next && !busy && setOpen(false)}
      title="Save changes before closing?"
      description={
        names.length === 1
          ? `“${names[0]}” has unsaved changes.`
          : `${names.length} documents have unsaved changes.`
      }
      footer={
        <>
          <ModalCancel onClick={() => setOpen(false)} />
          <Button variant="secondary" disabled={busy} onClick={close}>
            Close without saving
          </Button>
          <Button disabled={busy} onClick={() => void saveAndClose()}>
            Save and close
          </Button>
        </>
      }
    >
      {names.length > 1 && (
        <ul className="mt-3 space-y-1 text-[13px] text-text">
          {names.map((name) => (
            <li key={name} className="truncate">
              {name}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
