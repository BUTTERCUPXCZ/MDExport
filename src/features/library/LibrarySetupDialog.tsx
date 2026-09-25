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
      label="Setup · 1 of 1"
      title="Choose your library folder"
      description="MDForge saves new documents as plain .md files in this folder. You can change it later in Settings."
      footer={
        <>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => run(libraryService.chooseLocation)}
          >
            Choose folder…
          </Button>
          <Button disabled={busy} onClick={() => run(libraryService.useDefaultLocation)}>
            Use this folder
          </Button>
        </>
      }
    >
      <div className="border-t pt-3">
        <p className="label">Default location</p>
        <p className="mt-1.5 font-mono text-[13px] break-all">{defaultPath ?? "…"}</p>
        {error && (
          <p role="alert" className="mt-3 font-mono text-[12px] text-danger">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
