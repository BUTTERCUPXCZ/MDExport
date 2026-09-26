import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { documentService } from "@/services/tauri/documents";
import { libraryService } from "@/services/tauri/library";
import {
  docFile,
  LIBRARY,
  renderAt,
  renderEditor,
  sampleListing,
  setupApp,
} from "@/test/renderApp";

const sidebar = () => screen.getByRole("navigation", { name: "Documents" });
const AUTH_FLOW = `${LIBRARY}/backend/handovers/auth-flow.md`;
const RENAMED = `${LIBRARY}/backend/handovers/login-flow.md`;

/** Library listing after auth-flow.md was renamed to login-flow.md. */
function listingAfterRename() {
  const listing = sampleListing();
  listing.documents = listing.documents.map((d) =>
    d.path === AUTH_FLOW
      ? {
          ...d,
          path: RENAMED,
          name: "login-flow.md",
          relativePath: "backend/handovers/login-flow.md",
        }
      : d,
  );
  return listing;
}

async function openContextMenu(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.pointer({
    keys: "[MouseRight]",
    target: within(sidebar()).getByRole("button", { name }),
  });
  return screen.getByRole("menu");
}

describe("Renaming documents", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("right-click → Rename edits the name in place and renames on Enter", async () => {
    const user = userEvent.setup();
    const rename = vi
      .spyOn(documentService, "rename")
      .mockResolvedValue({ path: RENAMED, name: "login-flow.md" });
    await renderAt("/");
    vi.mocked(libraryService.list).mockResolvedValue(listingAfterRename());

    const menu = await openContextMenu(user, "auth-flow");
    await user.click(within(menu).getByRole("menuitem", { name: /Rename/ }));

    const field = within(sidebar()).getByRole("textbox", { name: "Document name" });
    expect(field).toHaveValue("auth-flow");
    await user.clear(field);
    await user.type(field, "login-flow{Enter}");

    expect(rename).toHaveBeenCalledWith(AUTH_FLOW, "login-flow");
    expect(
      await within(sidebar()).findByRole("button", { name: "login-flow" }),
    ).toBeInTheDocument();
    expect(within(sidebar()).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("Esc cancels, and an unchanged name does nothing", async () => {
    const user = userEvent.setup();
    const rename = vi.spyOn(documentService, "rename");
    await renderAt("/");

    await user.click(
      within(await openContextMenu(user, "api")).getByRole("menuitem", { name: /Rename/ }),
    );
    await user.type(within(sidebar()).getByRole("textbox"), "-changed{Escape}");
    expect(within(sidebar()).getByRole("button", { name: "api" })).toBeInTheDocument();

    await user.click(
      within(await openContextMenu(user, "api")).getByRole("menuitem", { name: /Rename/ }),
    );
    await user.keyboard("{Enter}");

    expect(rename).not.toHaveBeenCalled();
    expect(within(sidebar()).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows errors inline and keeps the field open to fix them", async () => {
    const user = userEvent.setup();
    const rename = vi
      .spyOn(documentService, "rename")
      .mockRejectedValueOnce({ kind: "alreadyExists", message: "Already exists: payments.md" })
      .mockResolvedValueOnce({ path: RENAMED, name: "login-flow.md" });
    await renderAt("/");

    await user.click(
      within(await openContextMenu(user, "auth-flow")).getByRole("menuitem", { name: /Rename/ }),
    );
    const field = within(sidebar()).getByRole("textbox", { name: "Document name" });
    await user.clear(field);
    await user.type(field, "payments{Enter}");

    expect(await within(sidebar()).findByRole("alert")).toHaveTextContent(
      "Already exists: payments.md",
    );
    expect(field).toHaveAttribute("aria-invalid", "true");

    await user.clear(field);
    await user.type(field, "login-flow{Enter}");

    expect(rename).toHaveBeenLastCalledWith(AUTH_FLOW, "login-flow");
    await waitFor(() => expect(within(sidebar()).queryByRole("textbox")).not.toBeInTheDocument());
  });

  it("F2 renames the open document and keeps its unsaved edits", async () => {
    const user = userEvent.setup();
    vi.spyOn(documentService, "rename").mockResolvedValue({ path: RENAMED, name: "login-flow.md" });
    const { id } = await renderEditor(docFile({ path: AUTH_FLOW, name: "auth-flow.md" }));
    useDocumentsStore.getState().setContent(id, "unsaved edit");
    vi.mocked(libraryService.list).mockResolvedValue(listingAfterRename());

    await user.keyboard("{F2}");
    const field = within(sidebar()).getByRole("textbox", { name: "Document name" });
    await user.clear(field);
    await user.type(field, "login-flow{Enter}");

    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 1, name: "login-flow" })).toBeInTheDocument(),
    );
    expect(screen.getByText("backend / handovers / login-flow.md")).toBeInTheDocument();
    expect(useDocumentsStore.getState().documents[id]).toMatchObject({
      path: RENAMED,
      name: "login-flow.md",
      content: "unsaved edit",
    });
  });

  it("the document actions menu and the quick switcher start a rename too", async () => {
    const user = userEvent.setup();
    await renderEditor(docFile({ path: AUTH_FLOW, name: "auth-flow.md" }));

    await user.click(screen.getByRole("button", { name: "Document actions" }));
    await user.click(screen.getByRole("menuitem", { name: /Rename/ }));
    expect(within(sidebar()).getByRole("textbox", { name: "Document name" })).toHaveValue(
      "auth-flow",
    );
    await user.keyboard("{Escape}");

    await user.keyboard("{Control>}k{/Control}");
    await user.type(screen.getByRole("combobox"), ">rename{Enter}");
    expect(within(sidebar()).getByRole("textbox", { name: "Document name" })).toBeInTheDocument();
  });

  it("Copy path puts the file path on the clipboard", async () => {
    const user = userEvent.setup();
    await renderAt("/");

    await user.click(
      within(await openContextMenu(user, "api")).getByRole("menuitem", { name: /Copy path/ }),
    );

    expect(await navigator.clipboard.readText()).toBe(`${LIBRARY}/backend/api.md`);
  });
});
