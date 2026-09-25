import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { documentService } from "@/services/tauri/documents";
import { libraryService } from "@/services/tauri/library";
import { docFile, LIBRARY, renderAt, renderEditor, setupApp } from "@/test/renderApp";

const rail = () => screen.getByRole("navigation", { name: "Folders" });
const sidebar = () => screen.getByRole("navigation", { name: "Main" });

/** Makes documentService.open return a file for whatever path is requested. */
function openAnyPath() {
  return vi
    .spyOn(documentService, "open")
    .mockImplementation(async (path) =>
      docFile({ path, name: path.split("/").pop()!, content: `# ${path}` }),
    );
}

describe("Folder rail", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("shows Home plus one entry per top-level library folder", async () => {
    await renderAt("/");

    expect(within(rail()).getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(rail()).getByRole("link", { name: "backend" })).toHaveTextContent("B");
  });

  it("selecting a folder shows its documents grouped by subfolder", async () => {
    const user = userEvent.setup();
    const router = await renderAt("/");
    expect(within(sidebar()).getByRole("button", { name: "Readme" })).toBeInTheDocument();

    await user.click(within(rail()).getByRole("link", { name: "backend" }));

    expect(router.state.location.pathname).toBe("/folder/backend");
    expect(screen.getByRole("heading", { name: "Welcome to backend" })).toBeInTheDocument();
    expect(within(sidebar()).getByRole("button", { name: "api" })).toBeInTheDocument();
    const handovers = within(sidebar()).getByRole("region", { name: "handovers" });
    expect(within(handovers).getByRole("button", { name: "auth-flow" })).toBeInTheDocument();
    expect(within(sidebar()).queryByRole("button", { name: "Readme" })).not.toBeInTheDocument();
  });

  it("categories collapse and expand", async () => {
    const user = userEvent.setup();
    await renderAt("/folder/backend");
    const handovers = within(sidebar()).getByRole("region", { name: "handovers" });

    await user.click(within(handovers).getByRole("button", { name: "handovers" }));
    expect(within(handovers).queryByRole("button", { name: "auth-flow" })).not.toBeInTheDocument();

    await user.click(within(handovers).getByRole("button", { name: "handovers" }));
    expect(within(handovers).getByRole("button", { name: "auth-flow" })).toBeInTheDocument();
  });

  it("clicking a document opens it and keeps its folder selected", async () => {
    const user = userEvent.setup();
    openAnyPath();
    await renderAt("/folder/backend");

    await user.click(within(sidebar()).getByRole("button", { name: "auth-flow" }));

    expect(screen.getByRole("heading", { level: 1, name: "auth-flow" })).toBeInTheDocument();
    expect(screen.getByText("backend / handovers / auth-flow.md")).toBeInTheDocument();
    expect(within(rail()).getByRole("link", { name: "backend" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(sidebar()).getByRole("button", { name: "auth-flow" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("reopening a document keeps its unsaved changes", async () => {
    const user = userEvent.setup();
    const open = openAnyPath();
    await renderAt("/folder/backend");
    await user.click(within(sidebar()).getByRole("button", { name: "api" }));
    const id = Object.keys(useDocumentsStore.getState().documents)[0]!;
    useDocumentsStore.getState().setContent(id, "unsaved edit");

    await user.click(within(sidebar()).getByRole("button", { name: "auth-flow" }));
    await user.click(within(sidebar()).getByRole("button", { name: "api (unsaved changes)" }));

    expect(open).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("textbox", { name: "Markdown editor" })).toHaveTextContent(
      "unsaved edit",
    );
  });

  it("flags folders that contain unsaved documents", async () => {
    await renderEditor(docFile({ path: `${LIBRARY}/backend/api.md`, name: "api.md" }));
    const id = Object.keys(useDocumentsStore.getState().documents)[0]!;

    useDocumentsStore.getState().setContent(id, "changed");

    expect(
      await within(rail()).findByRole("link", { name: "backend (unsaved changes)" }),
    ).toBeInTheDocument();
  });

  it("the category + creates a document in that subfolder", async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(documentService, "create").mockResolvedValue(docFile());
    await renderAt("/folder/backend");

    await user.click(within(sidebar()).getByRole("button", { name: "New document in handovers" }));

    expect(create).toHaveBeenCalledWith("backend/handovers");
  });

  it("the rail + creates a folder and selects it", async () => {
    const user = userEvent.setup();
    const createFolder = vi.spyOn(libraryService, "createFolder").mockResolvedValue("frontend");
    const router = await renderAt("/");

    await user.click(within(rail()).getByRole("button", { name: "Create folder" }));
    const dialog = screen.getByRole("alertdialog", { name: "Create a folder" });
    await user.type(within(dialog).getByLabelText("Folder name"), "frontend{Enter}");

    expect(createFolder).toHaveBeenCalledWith("frontend");
    await waitFor(() => expect(router.state.location.pathname).toBe("/folder/frontend"));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("shows folder name errors inline", async () => {
    const user = userEvent.setup();
    vi.spyOn(libraryService, "createFolder").mockRejectedValue({
      kind: "alreadyExists",
      message: "Already exists: backend",
    });
    await renderAt("/");

    await user.click(within(rail()).getByRole("button", { name: "Create folder" }));
    await user.type(screen.getByLabelText("Folder name"), "backend{Enter}");

    expect(await screen.findByText("Already exists: backend")).toBeInTheDocument();
  });
});

describe("Quick switcher", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("Ctrl+K finds a document by fuzzy name and opens it with Enter", async () => {
    const user = userEvent.setup();
    const open = openAnyPath();
    await renderAt("/");

    await user.keyboard("{Control>}k{/Control}");
    const input = screen.getByRole("combobox", { name: "Search documents and commands" });
    await user.type(input, "authfl");

    const results = screen.getByRole("listbox", { name: "Results" });
    expect(within(results).getAllByRole("option")[0]).toHaveTextContent("auth-flow");
    await user.keyboard("{Enter}");

    expect(open).toHaveBeenCalledWith(`${LIBRARY}/backend/handovers/auth-flow.md`);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("the sidebar search button opens it too, showing recent documents first", async () => {
    const user = userEvent.setup();
    await renderAt("/");

    await user.click(screen.getByRole("button", { name: /Find a document/ }));

    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options[0]).toHaveTextContent("auth-flow");
  });

  it("'>' lists commands only, and arrow keys pick one", async () => {
    const user = userEvent.setup();
    const router = await renderAt("/");

    await user.keyboard("{Control>}k{/Control}");
    await user.type(screen.getByRole("combobox"), ">settings");
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options.every((o) => !o.textContent?.includes("auth-flow"))).toBe(true);
    await user.keyboard("{Enter}");

    expect(router.state.location.pathname).toBe("/settings");
  });

  it("says when nothing matches", async () => {
    const user = userEvent.setup();
    await renderAt("/");

    await user.keyboard("{Control>}k{/Control}");
    await user.type(screen.getByRole("combobox"), "zzzzqq");

    expect(screen.getByText(/No documents or commands match/)).toBeInTheDocument();
  });
});

describe("Keyboard navigation", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("Ctrl+/ opens the shortcuts sheet", async () => {
    const user = userEvent.setup();
    await renderAt("/");

    await user.keyboard("{Control>}/{/Control}");

    const sheet = screen.getByRole("dialog", { name: "Keyboard shortcuts" });
    expect(within(sheet).getByText("Next document in sidebar")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Ctrl+PageDown / PageUp step through the sidebar's documents", async () => {
    const user = userEvent.setup();
    const open = openAnyPath();
    await renderAt("/folder/backend");

    await user.keyboard("{Control>}{PageDown}{/Control}");
    expect(open).toHaveBeenLastCalledWith(`${LIBRARY}/backend/api.md`);

    await user.keyboard("{Control>}{PageDown}{/Control}");
    expect(open).toHaveBeenLastCalledWith(`${LIBRARY}/backend/handovers/auth-flow.md`);

    await user.keyboard("{Control>}{PageUp}{/Control}");
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1, name: "api" })).toBeInTheDocument(),
    );
  });

  it("Ctrl+\\ cycles the editor view", async () => {
    const user = userEvent.setup();
    await renderEditor();
    expect(screen.getByRole("button", { name: "Split view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.keyboard("{Control>}\\{/Control}");

    expect(screen.getByRole("button", { name: "Preview only" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
