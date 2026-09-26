import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { documentService } from "@/services/tauri/documents";
import { libraryService } from "@/services/tauri/library";
import { docFile, LIBRARY, renderAt, renderEditor, setupApp } from "@/test/renderApp";

const index = () => screen.getByRole("navigation", { name: "Documents" });

/** Makes documentService.open return a file for whatever path is requested. */
function openAnyPath() {
  return vi
    .spyOn(documentService, "open")
    .mockImplementation(async (path) =>
      docFile({ path, name: path.split("/").pop()!, content: `# ${path}` }),
    );
}

describe("Library index", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("lists the whole library: root documents, then folders with counts", async () => {
    await renderAt("/");

    const rows = within(index()).getAllByRole("button");
    const names = rows.map((r) => r.getAttribute("aria-label") ?? r.textContent);
    expect(names.indexOf("Readme")).toBeLessThan(names.findIndex((n) => /^backend/.test(n!)));
    expect(within(index()).getByRole("button", { name: /^backend\s*2$/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    const handovers = within(index()).getByRole("group", { name: "handovers" });
    expect(within(handovers).getByRole("button", { name: "auth-flow" })).toHaveTextContent("1m");
  });

  it("folders collapse and expand", async () => {
    const user = userEvent.setup();
    await renderAt("/");
    const handovers = within(index()).getByRole("group", { name: "handovers" });

    await user.click(within(handovers).getByRole("button", { name: /^handovers/ }));
    expect(within(handovers).queryByRole("button", { name: "auth-flow" })).not.toBeInTheDocument();

    await user.click(within(handovers).getByRole("button", { name: /^handovers/ }));
    expect(within(handovers).getByRole("button", { name: "auth-flow" })).toBeInTheDocument();
  });

  it("clicking a document opens it and marks it current", async () => {
    const user = userEvent.setup();
    openAnyPath();
    await renderAt("/");

    await user.click(within(index()).getByRole("button", { name: "auth-flow" }));

    expect(await screen.findByRole("heading", { level: 1, name: "auth-flow" })).toBeInTheDocument();
    expect(screen.getByText("backend / handovers / auth-flow.md")).toBeInTheDocument();
    expect(within(index()).getByRole("button", { name: "auth-flow" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("reopening a document keeps its unsaved changes", async () => {
    const user = userEvent.setup();
    const open = openAnyPath();
    await renderAt("/");
    await user.click(within(index()).getByRole("button", { name: "api" }));
    await screen.findByRole("heading", { level: 1, name: "api" });
    const id = Object.keys(useDocumentsStore.getState().documents)[0]!;
    useDocumentsStore.getState().setContent(id, "unsaved edit");

    await user.click(within(index()).getByRole("button", { name: "auth-flow" }));
    await user.click(within(index()).getByRole("button", { name: "api (unsaved changes)" }));

    expect(open).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("textbox", { name: "Markdown editor" })).toHaveTextContent(
      "unsaved edit",
    );
  });

  it("a folder's hover buttons create a document or folder inside it, named in place", async () => {
    const user = userEvent.setup();
    const create = vi
      .spyOn(documentService, "create")
      .mockResolvedValue(
        docFile({ path: `${LIBRARY}/backend/handovers/login.md`, name: "login.md" }),
      );
    await renderAt("/");

    await user.click(within(index()).getByRole("button", { name: "New document in handovers" }));
    const field = within(index()).getByRole("textbox", { name: "New document name" });
    expect(within(index()).getByRole("group", { name: "handovers" })).toContainElement(field);
    await user.type(field, "login{Enter}");

    expect(create).toHaveBeenCalledWith("backend/handovers", "login");
    expect(await screen.findByRole("heading", { level: 1, name: "login" })).toBeInTheDocument();
    expect(within(index()).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("New folder at the bottom names the folder in place at the top level", async () => {
    const user = userEvent.setup();
    const createFolder = vi.spyOn(libraryService, "createFolder").mockResolvedValue("frontend");
    const list = vi.spyOn(libraryService, "list");
    await renderAt("/");
    const scans = list.mock.calls.length;

    await user.click(screen.getByRole("button", { name: "New folder" }));
    await user.type(
      within(index()).getByRole("textbox", { name: "New folder name" }),
      "frontend{Enter}",
    );

    expect(createFolder).toHaveBeenCalledWith("frontend", "");
    await waitFor(() => expect(within(index()).queryByRole("textbox")).not.toBeInTheDocument());
    expect(list.mock.calls.length).toBeGreaterThan(scans);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("Esc or an empty name cancels", async () => {
    const user = userEvent.setup();
    const createFolder = vi.spyOn(libraryService, "createFolder");
    await renderAt("/");

    await user.click(screen.getByRole("button", { name: "New folder" }));
    await user.type(within(index()).getByRole("textbox"), "draft{Escape}");
    expect(within(index()).queryByRole("textbox")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "New folder" }));
    await user.type(within(index()).getByRole("textbox"), "{Enter}");
    expect(within(index()).queryByRole("textbox")).not.toBeInTheDocument();
    expect(createFolder).not.toHaveBeenCalled();
  });

  it("shows name errors inline and keeps the field to fix them", async () => {
    const user = userEvent.setup();
    vi.spyOn(libraryService, "createFolder").mockRejectedValue({
      kind: "alreadyExists",
      message: "Already exists: backend",
    });
    await renderAt("/");

    await user.click(screen.getByRole("button", { name: "New folder" }));
    await user.type(within(index()).getByRole("textbox"), "backend{Enter}");

    expect(await within(index()).findByRole("alert")).toHaveTextContent("Already exists: backend");
    expect(within(index()).getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Library index menus", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  async function rightClick(user: ReturnType<typeof userEvent.setup>, target: HTMLElement) {
    await user.pointer({ keys: "[MouseRight]", target });
    return within(screen.getByRole("menu"));
  }

  it("a folder's menu creates a folder inside it, opening a collapsed folder", async () => {
    const user = userEvent.setup();
    const createFolder = vi
      .spyOn(libraryService, "createFolder")
      .mockResolvedValue("backend/archive");
    await renderAt("/");
    const backend = within(index()).getByRole("button", { name: /^backend/ });
    await user.click(backend); // collapse

    const menu = await rightClick(user, backend);
    await user.click(menu.getByRole("menuitem", { name: "New folder" }));
    expect(backend).toHaveAttribute("aria-expanded", "true");
    await user.type(
      within(index()).getByRole("textbox", { name: "New folder name" }),
      "archive{Enter}",
    );

    expect(createFolder).toHaveBeenCalledWith("archive", "backend");
  });

  it("the library name's menu creates a top-level folder", async () => {
    const user = userEvent.setup();
    await renderAt("/");

    const menu = await rightClick(user, within(index()).getByRole("link", { name: "MDForge" }));
    await user.click(menu.getByRole("menuitem", { name: "New folder" }));

    expect(within(index()).getByRole("textbox", { name: "New folder name" })).toBeInTheDocument();
  });

  it("moves a folder to trash after confirmation, closing its open documents", async () => {
    const user = userEvent.setup();
    const deleteFolder = vi.spyOn(libraryService, "deleteFolder").mockResolvedValue();
    const { router } = await renderEditor(
      docFile({ path: `${LIBRARY}/backend/api.md`, name: "api.md" }),
    );
    const id = Object.keys(useDocumentsStore.getState().documents)[0]!;
    useDocumentsStore.getState().setContent(id, "unsaved");

    const menu = await rightClick(user, within(index()).getByRole("button", { name: /^backend/ }));
    await user.click(menu.getByRole("menuitem", { name: "Move folder to trash" }));
    const dialog = screen.getByRole("alertdialog", { name: "Move “backend” to trash?" });
    expect(dialog).toHaveTextContent("It contains 2 documents");
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Unsaved changes in 1 open document will be lost.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Move to trash" }));

    expect(deleteFolder).toHaveBeenCalledWith("backend");
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(useDocumentsStore.getState().documents).toEqual({});
  });

  it("cancelling keeps the folder", async () => {
    const user = userEvent.setup();
    const deleteFolder = vi.spyOn(libraryService, "deleteFolder").mockResolvedValue();
    await renderAt("/");

    const menu = await rightClick(
      user,
      within(index()).getByRole("button", { name: /^handovers/ }),
    );
    await user.click(menu.getByRole("menuitem", { name: "Move folder to trash" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(deleteFolder).not.toHaveBeenCalled();
  });

  it("shows an error when the folder can't be trashed", async () => {
    const user = userEvent.setup();
    vi.spyOn(libraryService, "deleteFolder").mockRejectedValue({
      kind: "notFound",
      message: "Not found: backend",
    });
    await renderAt("/");

    const menu = await rightClick(user, within(index()).getByRole("button", { name: /^backend/ }));
    await user.click(menu.getByRole("menuitem", { name: "Move folder to trash" }));
    await user.click(screen.getByRole("button", { name: "Move to trash" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't move the folder to trash: Not found: backend",
    );
  });

  it("a document's menu creates a document next to it", async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(documentService, "create").mockResolvedValue(docFile());
    await renderAt("/");

    const menu = await rightClick(user, within(index()).getByRole("button", { name: "auth-flow" }));
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    await user.click(menu.getByRole("menuitem", { name: "New document here" }));
    await user.type(
      within(index()).getByRole("textbox", { name: "New document name" }),
      "notes{Enter}",
    );

    expect(create).toHaveBeenCalledWith("backend/handovers", "notes");
  });

  it("New folder here on a top-level document creates a top-level folder", async () => {
    const user = userEvent.setup();
    const createFolder = vi.spyOn(libraryService, "createFolder").mockResolvedValue("x");
    await renderAt("/");

    const menu = await rightClick(user, within(index()).getByRole("button", { name: "Readme" }));
    await user.click(menu.getByRole("menuitem", { name: "New folder here" }));
    await user.type(within(index()).getByRole("textbox", { name: "New folder name" }), "x{Enter}");

    expect(createFolder).toHaveBeenCalledWith("x", "");
  });

  it("right-clicking empty space creates at the top of the library", async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(documentService, "create").mockResolvedValue(docFile());
    await renderAt("/");

    const menu = await rightClick(user, index());
    expect(menu.getAllByRole("menuitem").map((i) => i.textContent)).toEqual([
      "New document",
      "New folder",
    ]);
    await user.click(menu.getByRole("menuitem", { name: "New document" }));
    await user.type(
      within(index()).getByRole("textbox", { name: "New document name" }),
      "ideas{Enter}",
    );

    expect(create).toHaveBeenCalledWith(undefined, "ideas");
  });

  it("moves a document to trash from its menu", async () => {
    const user = userEvent.setup();
    const del = vi.spyOn(documentService, "delete").mockResolvedValue();
    await renderAt("/");

    const menu = await rightClick(user, within(index()).getByRole("button", { name: "Readme" }));
    await user.click(menu.getByRole("menuitem", { name: "Move to trash" }));
    const dialog = screen.getByRole("alertdialog", { name: "Move “Readme.md” to trash?" });
    await user.click(within(dialog).getByRole("button", { name: "Move to trash" }));

    expect(del).toHaveBeenCalledWith(`${LIBRARY}/Readme.md`);
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

  it("the index search button opens it too, showing recent documents first", async () => {
    const user = userEvent.setup();
    await renderAt("/");

    const library = screen.getByRole("complementary", { name: "Library" });
    await user.click(within(library).getByRole("button", { name: /Find a document/ }));

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

    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
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
    expect(within(sheet).getByText("Next document in library")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Ctrl+PageDown / PageUp step through the library in index order", async () => {
    const user = userEvent.setup();
    const open = openAnyPath();
    await renderEditor(docFile({ path: `${LIBRARY}/Readme.md`, name: "Readme.md" }));

    await user.keyboard("{Control>}{PageDown}{/Control}");
    expect(open).toHaveBeenLastCalledWith(`${LIBRARY}/backend/api.md`);

    await user.keyboard("{Control>}{PageDown}{/Control}");
    expect(open).toHaveBeenLastCalledWith(`${LIBRARY}/backend/handovers/auth-flow.md`);

    await user.keyboard("{Control>}{PageUp}{/Control}");
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1, name: "api" })).toBeInTheDocument(),
    );
  });

  it("Ctrl+\\ switches between Write and Proof, Ctrl+E jumps to Deliver", async () => {
    const user = userEvent.setup();
    await renderEditor();
    const tab = (name: string) => screen.getByRole("tab", { name });
    expect(tab("Proof")).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Control>}\\{/Control}");
    expect(tab("Write")).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("region", { name: "Rendered preview" })).not.toBeInTheDocument();

    await user.keyboard("{Control>}\\{/Control}");
    expect(tab("Proof")).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Control>}e{/Control}");
    expect(tab("Deliver")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("complementary", { name: "Export" })).toBeInTheDocument();
  });
});
