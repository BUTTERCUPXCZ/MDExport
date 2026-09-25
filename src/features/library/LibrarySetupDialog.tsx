import { FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/layout/Modal";
import { Button } from "@/components/ui/button";
import { useLibraryLocation } from "@/features/library/useLibraryLocation";
import { libraryService } from "@/services/tauri/library";
import { toAppError } from "@/types/document";

/** First launch: asks where MDForge should keep new documents. */
export function LibrarySetupDialog() {
  const location = useLibraryLocation((s) => s.location);
  const load = useLibraryLocation((s) => s.load);
  const setLocation = useLibraryLocation((s) => s.set);
  const [defaultPath, setDefaultPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needed = location === null;

  useEffect(() => {
    // Outside Tauri (or on unexpected errors) don't block the app.
    load().catch(() => setLocation(""));
  }, [load, setLocation]);

  useEffect(() => {
    if (needed) libraryService.getDefaultLocation().then(setDefaultPath, () => {});
  }, [needed]);

  const run = async (action: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    try {
      const chosen = await action();
      if (chosen) setLocation(chosen);
    } catch (e) {
      setError(toAppError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={needed}
      title="Choose your library folder"
      description="MDForge saves new documents as plain .md files in this folder. You can change it later in Settings."
      footer={
        <>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => run(libraryService.chooseLocation)}
          >
            <FolderOpen data-icon="inline-start" />
            Choose folder…
          </Button>
          <Button disabled={busy} onClick={() => run(libraryService.useDefaultLocation)}>
            Use this folder
          </Button>
        </>
      }
    >
      <div className="pt-2">
        <div className="mb-2 text-xs font-bold tracking-wide text-header-secondary uppercase">
          Default location
        </div>
        <div className="rounded-sm bg-surface-tertiary px-2.5 py-2 font-mono text-sm break-all text-text-normal">
          {defaultPath ?? "…"}
        </div>
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
