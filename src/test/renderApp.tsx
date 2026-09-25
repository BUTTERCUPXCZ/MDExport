import { createMemoryHistory } from "@tanstack/react-router";
import { act, render } from "@testing-library/react";
import { vi } from "vitest";
import { App } from "@/app/App";
import { createAppRouter } from "@/app/router";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { useLibraryLocation } from "@/features/library/useLibraryLocation";
import { useNoticeStore } from "@/features/notices/noticeStore";
import { appService } from "@/services/tauri/app";
import { libraryService } from "@/services/tauri/library";
import { markdownService } from "@/services/tauri/markdown";
import type { DocumentFile } from "@/types/document";

export const LIBRARY = "/home/me/Documents/MDForge";

export function docFile(overrides: Partial<DocumentFile> = {}): DocumentFile {
  return {
    path: `${LIBRARY}/Bug Fix.md`,
    name: "Bug Fix.md",
    content: "# Bug Fix\n\nDetails",
    version: { hash: "v1", modifiedMs: 1 },
    ...overrides,
  };
}

/** Resets app stores and stubs the Tauri services every page touches. */
export function setupApp({ library = LIBRARY as string | null } = {}) {
  useDocumentsStore.setState({ documents: {} });
  useNoticeStore.setState({ notice: null });
  useLibraryLocation.setState({ location: undefined });

  vi.spyOn(appService, "getInfo").mockResolvedValue({ name: "MDForge", version: "0.1.0" });
  vi.spyOn(libraryService, "getLocation").mockResolvedValue(library);
  vi.spyOn(libraryService, "getDefaultLocation").mockResolvedValue(LIBRARY);
  vi.spyOn(markdownService, "render").mockImplementation(async (md) =>
    md.startsWith("# ") ? `<h1>${md.slice(2).split("\n")[0]}</h1>` : "",
  );
}

export async function renderAt(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  await act(() => router.load());
  render(<App router={router} />);
  return router;
}

/** Opens a document in the store and renders the editor for it. */
export async function renderEditor(file: DocumentFile = docFile()) {
  const id = useDocumentsStore.getState().add(file);
  const router = await renderAt(`/editor/${id}`);
  return { id, router };
}
