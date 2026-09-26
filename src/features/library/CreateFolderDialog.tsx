import { useState, type FormEvent } from "react";
import { Modal, ModalCancel } from "@/components/layout/Modal";
import { Button } from "@/components/ui/button";
import { refreshLibrary } from "@/features/library/libraryStore";
import { useUiStore } from "@/features/ui/uiStore";
import { libraryService } from "@/services/tauri/library";
import { toAppError } from "@/types/document";

/** Library footer / command: creates a top-level folder in the library. */
export function CreateFolderDialog() {
  const open = useUiStore((s) => s.createFolderOpen);
  // Mounted only while open, so the form starts empty every time.
  return open ? <CreateFolderModal /> : null;
}

function CreateFolderModal() {
  const setOpen = useUiStore((s) => s.setCreateFolderOpen);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await libraryService.createFolder(name);
      await refreshLibrary();
      setOpen(false);
    } catch (e) {
      setError(toAppError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onOpenChange={setOpen}
      title="Create a folder"
      description="Folders group related documents, e.g. one per project. It appears in the library index."
      footer={
        <>
          <ModalCancel onClick={() => setOpen(false)} />
          <Button disabled={busy || !name.trim()} onClick={() => void submit()}>
            Create
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => void submit(e)} className="pt-4">
        <label htmlFor="folder-name" className="mb-1.5 block text-[12.5px] font-medium text-text-2">
          Folder name
        </label>
        <input
          id="folder-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. backend"
          maxLength={64}
          className="h-9 w-full rounded-md border border-line-strong bg-canvas px-2.5 text-[14px] text-text placeholder:text-muted focus-visible:border-accent focus-visible:outline-none"
        />
        {error && (
          <p role="alert" className="mt-2 text-[13px] text-danger">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
