import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Modal, ModalCancel } from "@/components/layout/Modal";
import { Button } from "@/components/ui/button";
import { refreshLibrary } from "@/features/library/libraryStore";
import { useUiStore } from "@/features/ui/uiStore";
import { libraryService } from "@/services/tauri/library";
import { toAppError } from "@/types/document";

/** "+" on the rail: creates a top-level folder (a new rail entry). */
export function CreateFolderDialog() {
  const open = useUiStore((s) => s.createFolderOpen);
  // Mounted only while open, so the form starts empty every time.
  return open ? <CreateFolderModal /> : null;
}

function CreateFolderModal() {
  const setOpen = useUiStore((s) => s.setCreateFolderOpen);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const folder = await libraryService.createFolder(name);
      await refreshLibrary();
      setOpen(false);
      void navigate({ to: "/folder/$folder", params: { folder } });
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
      description="Folders group related documents, e.g. one per project. Each folder gets its own icon in the left rail."
      footer={
        <>
          <ModalCancel onClick={() => setOpen(false)} />
          <Button disabled={busy || !name.trim()} onClick={() => void submit()}>
            Create
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => void submit(e)} className="pt-2">
        <label
          htmlFor="folder-name"
          className="mb-2 block text-xs font-bold tracking-wide text-header-secondary uppercase"
        >
          Folder name
        </label>
        <input
          id="folder-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. backend"
          maxLength={64}
          className="h-10 w-full rounded-[3px] bg-surface-tertiary px-2.5 text-base text-text-normal placeholder:text-text-muted focus:outline-none"
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
