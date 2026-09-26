import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { usePrefsStore } from "@/features/prefs/prefsStore";
import { AUTOSAVE_DELAY_MS } from "@/features/session/useAutosave";
import { documentService } from "@/services/tauri/documents";
import { windowService } from "@/services/tauri/window";
import { docFile, LIBRARY, renderAt, renderEditor, setupApp } from "@/test/renderApp";

const wait = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)));

type CloseHandler = (event: { preventDefault: () => void }) => Promise<void> | void;

/** Captures the close-requested handler the app registers. */
function mockWindowClose() {
  let handler: CloseHandler | undefined;
  vi.spyOn(windowService, "onCloseRequested").mockImplementation(async (h) => {
    handler = h;
    return () => {};
  });
  const destroy = vi.spyOn(windowService, "destroy").mockResolvedValue();
  const requestClose = async () => {
    const preventDefault = vi.fn();
    await act(async () => handler!({ preventDefault }));
    return preventDefault;
  };
  return { destroy, requestClose };
}

describe("Autosave", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("saves a second after typing stops", async () => {
    usePrefsStore.setState({ autosave: true });
    const save = vi.spyOn(documentService, "save").mockResolvedValue({ hash: "v2", modifiedMs: 2 });
    const { id } = await renderEditor();

    act(() => useDocumentsStore.getState().setContent(id, "# Bug Fix\n\nTyped"));
    await wait(AUTOSAVE_DELAY_MS / 2);
    expect(save).not.toHaveBeenCalled();
    await wait(AUTOSAVE_DELAY_MS);

    expect(save).toHaveBeenCalledWith(expect.any(String), "# Bug Fix\n\nTyped", "v1", false);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Saved"));
  });

  it("does nothing when turned off in Settings", async () => {
    const user = userEvent.setup();
    usePrefsStore.setState({ autosave: true });
    const save = vi.spyOn(documentService, "save").mockResolvedValue({ hash: "v2", modifiedMs: 2 });
    await renderAt("/settings");

    await user.click(screen.getByRole("checkbox", { name: /Save automatically/ }));
    expect(usePrefsStore.getState().autosave).toBe(false);

    const id = useDocumentsStore.getState().add(docFile());
    act(() => useDocumentsStore.getState().setContent(id, "changed"));
    await wait(AUTOSAVE_DELAY_MS + 200);
    expect(save).not.toHaveBeenCalled();
  });
});

describe("Closing the window", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("closes straight away when everything is saved", async () => {
    const { requestClose, destroy } = mockWindowClose();
    await renderEditor();

    const preventDefault = await requestClose();

    expect(preventDefault).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled(); // Tauri closes it
  });

  it("with autosave on, saves pending edits and then closes", async () => {
    usePrefsStore.setState({ autosave: true });
    const { requestClose, destroy } = mockWindowClose();
    const save = vi.spyOn(documentService, "save").mockResolvedValue({ hash: "v2", modifiedMs: 2 });
    const { id } = await renderEditor();
    act(() => useDocumentsStore.getState().setContent(id, "last words"));

    const preventDefault = await requestClose();

    expect(preventDefault).toHaveBeenCalled();
    expect(save).toHaveBeenCalledWith(expect.any(String), "last words", "v1", false);
    expect(destroy).toHaveBeenCalled();
  });

  it("with autosave off, asks first; Close without saving closes", async () => {
    const user = userEvent.setup();
    const { requestClose, destroy } = mockWindowClose();
    const save = vi.spyOn(documentService, "save");
    const { id } = await renderEditor();
    act(() => useDocumentsStore.getState().setContent(id, "draft"));

    await requestClose();
    const dialog = screen.getByRole("alertdialog", { name: "Save changes before closing?" });
    expect(dialog).toHaveTextContent("“Bug Fix” has unsaved changes.");
    await user.click(within(dialog).getByRole("button", { name: "Close without saving" }));

    expect(destroy).toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("Save and close saves, then closes", async () => {
    const user = userEvent.setup();
    const { requestClose, destroy } = mockWindowClose();
    const save = vi.spyOn(documentService, "save").mockResolvedValue({ hash: "v2", modifiedMs: 2 });
    const { id } = await renderEditor();
    act(() => useDocumentsStore.getState().setContent(id, "draft"));

    await requestClose();
    await user.click(screen.getByRole("button", { name: "Save and close" }));

    expect(save).toHaveBeenCalled();
    await waitFor(() => expect(destroy).toHaveBeenCalled());
  });

  it("Cancel keeps the window and the edits", async () => {
    const user = userEvent.setup();
    const { requestClose, destroy } = mockWindowClose();
    const { id } = await renderEditor();
    act(() => useDocumentsStore.getState().setContent(id, "draft"));

    await requestClose();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(destroy).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(useDocumentsStore.getState().documents[id]?.content).toBe("draft");
  });
});

describe("Session restore", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("reopens the last library document on launch", async () => {
    const path = `${LIBRARY}/backend/api.md`;
    usePrefsStore.setState({ lastDocumentPath: path, lastStage: "write" });
    const open = vi
      .spyOn(documentService, "open")
      .mockResolvedValue(docFile({ path, name: "api.md" }));

    await renderAt("/");

    await waitFor(() => expect(open).toHaveBeenCalledWith(path));
    expect(await screen.findByRole("heading", { level: 1, name: "api" })).toBeInTheDocument();
  });

  it("skips documents that are no longer in the library", async () => {
    usePrefsStore.setState({ lastDocumentPath: `${LIBRARY}/gone.md` });
    const open = vi.spyOn(documentService, "open");

    await renderAt("/");
    await wait(50);

    expect(open).not.toHaveBeenCalled();
    expect(usePrefsStore.getState().lastDocumentPath).toBeNull();
  });

  it("remembers the open document and the stage", async () => {
    const user = userEvent.setup();
    await renderEditor();
    expect(usePrefsStore.getState().lastDocumentPath).toBe(`${LIBRARY}/Bug Fix.md`);

    await user.click(screen.getByRole("tab", { name: "Write" }));
    expect(usePrefsStore.getState().lastStage).toBe("write");
  });
});

describe("Find and replace", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("Ctrl+F opens find and replace in the editor", async () => {
    const user = userEvent.setup();
    await renderEditor();
    await user.click(screen.getByRole("textbox", { name: "Markdown editor" }));

    await user.keyboard("{Control>}f{/Control}");
    expect(screen.getByRole("textbox", { name: "Find" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Replace" })).toBeInTheDocument();
  });
});
