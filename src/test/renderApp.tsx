import { createMemoryHistory } from "@tanstack/react-router";
import { act, render } from "@testing-library/react";
import { vi } from "vitest";
import { App } from "@/app/App";
import { createAppRouter } from "@/app/router";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { useLibraryStore } from "@/features/library/libraryStore";
import { useLibraryLocation } from "@/features/library/useLibraryLocation";
import { usePrefsStore } from "@/features/prefs/prefsStore";
import { useUiStore } from "@/features/ui/uiStore";
import { useNoticeStore } from "@/features/notices/noticeStore";
import { appService } from "@/services/tauri/app";
import { libraryService } from "@/services/tauri/library";
import { useUpdateStore } from "@/features/updates/updateStore";
import { useExportDialog } from "@/features/export/exportDialogStore";
import { markdownService } from "@/services/tauri/markdown";
import { updaterService } from "@/services/tauri/updater";
import type { DocumentFile } from "@/types/document";
import type { LibraryEntry, LibraryListing } from "@/types/library";

export const LIBRARY = "/home/me/Documents/MDExport";

export function docFile(overrides: Partial<DocumentFile> = {}): DocumentFile {
  return {
    path: `${LIBRARY}/Bug Fix.md`,
    name: "Bug Fix.md",
    content: "# Bug Fix\n\nDetails",
    version: { hash: "v1", modifiedMs: 1 },
    ...overrides,
  };
}

const entry = (relativePath: string, modifiedMs: number): LibraryEntry => ({
  path: `${LIBRARY}/${relativePath}`,
  relativePath,
  name: relativePath.split("/").pop()!,
  modifiedMs,
});

/** Sample library: two root files, a `backend` folder with a `handovers` category. */
export function sampleListing(): LibraryListing {
  return {
    root: LIBRARY,
    folders: ["backend", "backend/handovers"],
    documents: [
      entry("Bug Fix.md", Date.now() - 60_000),
      entry("Readme.md", Date.now() - 3_600_000),
      entry("backend/api.md", Date.now() - 7_200_000),
      entry("backend/handovers/auth-flow.md", Date.now() - 30_000),
    ],
    truncated: false,
  };
}

/** Resets app stores and stubs the Tauri services every page touches. */
export function setupApp({
  library = LIBRARY as string | null,
  listing = sampleListing(),
}: { library?: string | null; listing?: LibraryListing } = {}) {
  useDocumentsStore.setState({ documents: {} });
  useNoticeStore.setState({ notice: null });
  useLibraryLocation.setState({ location: undefined });
  useLibraryStore.setState({ listing: null, status: "idle" });
  window.localStorage.clear();
  usePrefsStore.setState({
    autosave: false,
    lastDocumentPath: null,
    lastStage: "proof",
    autoUpdateCheck: true,
    skippedVersion: null,
    pdfPages: "a4",
  });
  useUiStore.setState({
    quickSwitcherOpen: false,
    shortcutsOpen: false,
    creating: null,
    closeGuardOpen: false,
    renamingPath: null,
    exporting: null,
    stage: "proof",
    exportFormat: "pdf",
  });

  vi.spyOn(appService, "getInfo").mockResolvedValue({ name: "MDExport", version: "0.1.0" });
  vi.spyOn(libraryService, "getLocation").mockResolvedValue(library);
  vi.spyOn(libraryService, "getDefaultLocation").mockResolvedValue(LIBRARY);
  vi.spyOn(libraryService, "list").mockResolvedValue(listing);
  useExportDialog.setState({ state: { phase: "closed" } });
  useUpdateStore.setState({
    status: "idle",
    info: null,
    progress: null,
    error: null,
    dialogOpen: false,
    announced: [],
  });
  vi.spyOn(updaterService, "check").mockResolvedValue(null);
  vi.spyOn(markdownService, "render").mockImplementation(async (md) =>
    md.startsWith("# ") ? `<h2>${md.slice(2).split("\n")[0]}</h2>` : "",
  );
}

export async function renderAt(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  await act(() => router.load());
  render(<App router={router} />);
  // Let the initial library scan settle.
  await act(async () => {});
  return router;
}

/** Opens a document in the store and renders the editor for it. */
export async function renderEditor(file: DocumentFile = docFile()) {
  const id = useDocumentsStore.getState().add(file);
  const router = await renderAt(`/editor/${id}`);
  return { id, router };
}
