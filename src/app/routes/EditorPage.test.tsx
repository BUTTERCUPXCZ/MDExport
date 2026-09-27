import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { documentService } from "@/services/tauri/documents";
import { markdownService } from "@/services/tauri/markdown";
import { docFile, renderAt, renderEditor, setupApp } from "@/test/renderApp";

const content = (id: string) => useDocumentsStore.getState().documents[id]?.content;
const saveState = () => screen.getByRole("status");
const index = () => screen.getByRole("navigation", { name: "Documents" });

async function openActions(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Document actions" }));
  return screen.getByRole("menu");
}

describe("Editor page", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("opens in Proof: the source beside the rendered page", async () => {
    await renderEditor();

    expect(screen.getByRole("heading", { level: 1, name: "Bug Fix" })).toBeInTheDocument();
    expect(screen.getByText("Bug Fix.md")).toBeInTheDocument(); // path in the library
    expect(screen.getByRole("textbox", { name: "Markdown editor" })).toHaveTextContent("# Bug Fix");
    const preview = screen.getByRole("article", { name: "Preview" });
    expect(await within(preview).findByRole("heading", { name: "Bug Fix" })).toBeInTheDocument();
    expect(markdownService.render).toHaveBeenCalledWith("# Bug Fix\n\nDetails");
  });

  it("falls back to the file name when there is no heading", async () => {
    await renderEditor(docFile({ name: "notes.md", content: "plain text" }));

    expect(screen.getByRole("heading", { level: 1, name: "notes" })).toBeInTheDocument();
  });

  it("shows the save state in the header and cursor and length in the status bar", async () => {
    const { id } = await renderEditor();
    const footer = screen.getByRole("contentinfo", { name: "Document status" });
    expect(footer).toHaveTextContent("Ln 1, Col 1");
    expect(footer).toHaveTextContent("3 words");
    expect(saveState()).toHaveTextContent("Saved");

    useDocumentsStore.getState().setContent(id, "# Bug Fix\n\nMore details");

    await waitFor(() => expect(saveState()).toHaveTextContent("Unsaved"));
  });

  it("Ctrl+S saves with the version the editor last saw", async () => {
    const user = userEvent.setup();
    const save = vi.spyOn(documentService, "save").mockResolvedValue({ hash: "v2", modifiedMs: 2 });
    const { id } = await renderEditor();
    useDocumentsStore.getState().setContent(id, "# Bug Fix\n\nEdited");

    await user.keyboard("{Control>}s{/Control}");

    expect(save).toHaveBeenCalledWith(
      "/home/me/Documents/MDExport/Bug Fix.md",
      "# Bug Fix\n\nEdited",
      "v1",
      false,
    );
    await waitFor(() => expect(saveState()).toHaveTextContent("Saved"));
  });

  it("Save in the actions menu is disabled until there are unsaved changes", async () => {
    const user = userEvent.setup();
    const { id } = await renderEditor();
    let menu = await openActions(user);
    expect(within(menu).getByRole("menuitem", { name: /^Save\s*Ctrl S$/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await user.keyboard("{Escape}");

    useDocumentsStore.getState().setContent(id, "changed");

    menu = await openActions(user);
    expect(within(menu).getByRole("menuitem", { name: /^Save\s*Ctrl S$/ })).not.toHaveAttribute(
      "aria-disabled",
    );
  });

  it("Ctrl+Shift+S saves as a new file", async () => {
    const user = userEvent.setup();
    const saveAs = vi
      .spyOn(documentService, "saveAs")
      .mockResolvedValue(docFile({ path: "/elsewhere/copy.md", name: "copy.md" }));
    await renderEditor();

    await user.keyboard("{Control>}{Shift>}S{/Shift}{/Control}");

    expect(saveAs).toHaveBeenCalledWith("# Bug Fix\n\nDetails", "Bug Fix.md");
    expect(await screen.findByText("/elsewhere/copy.md")).toBeInTheDocument();
  });

  describe("when the file changed on disk", () => {
    const conflict = {
      kind: "conflict",
      message: "The file changed on disk since it was opened",
      current: { hash: "disk", modifiedMs: 9 },
    };

    async function saveIntoConflict() {
      const user = userEvent.setup();
      const save = vi.spyOn(documentService, "save").mockRejectedValueOnce(conflict);
      const { id } = await renderEditor();
      useDocumentsStore.getState().setContent(id, "mine");
      await user.keyboard("{Control>}s{/Control}");
      await screen.findByRole("alertdialog", { name: "File changed on disk" });
      return { user, save, id };
    }

    it("asks before overwriting, then force-saves", async () => {
      const { user, save } = await saveIntoConflict();
      save.mockResolvedValueOnce({ hash: "v2", modifiedMs: 2 });

      await user.click(screen.getByRole("button", { name: "Overwrite" }));

      expect(save).toHaveBeenLastCalledWith(expect.any(String), "mine", "v1", true);
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    });

    it("can reload the disk version, discarding local edits", async () => {
      const { user, id } = await saveIntoConflict();
      vi.spyOn(documentService, "open").mockResolvedValue(docFile({ content: "# From disk" }));

      await user.click(screen.getByRole("button", { name: "Reload from disk" }));

      await waitFor(() => expect(content(id)).toBe("# From disk"));
      expect(screen.getByRole("textbox", { name: "Markdown editor" })).toHaveTextContent(
        "# From disk",
      );
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });

    it("can keep both by saving a copy", async () => {
      const { user } = await saveIntoConflict();
      const saveAs = vi.spyOn(documentService, "saveAs").mockResolvedValue(null);

      await user.click(screen.getByRole("button", { name: "Save as copy" }));

      expect(saveAs).toHaveBeenCalledWith("mine", "Bug Fix.md");
    });

    it("cancel keeps the edits unsaved", async () => {
      const { user, id } = await saveIntoConflict();

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(content(id)).toBe("mine");
      expect(saveState()).toHaveTextContent("Unsaved");
    });
  });

  it("moves the document to trash after confirmation", async () => {
    const user = userEvent.setup();
    const del = vi.spyOn(documentService, "delete").mockResolvedValue();
    const { router } = await renderEditor();

    await user.click(
      within(await openActions(user)).getByRole("menuitem", { name: "Move to trash" }),
    );
    const dialog = screen.getByRole("alertdialog", { name: "Move “Bug Fix.md” to trash?" });
    await user.click(within(dialog).getByRole("button", { name: "Move to trash" }));

    expect(del).toHaveBeenCalledWith("/home/me/Documents/MDExport/Bug Fix.md");
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
  });

  it("shows a helpful state for documents that are not open", async () => {
    await renderAt("/editor/unknown-id");

    expect(screen.getByText("This document isn't open")).toBeInTheDocument();
  });

  it("Write shows only the source; Deliver shows the page and export, keeping the editor", async () => {
    const user = userEvent.setup();
    await renderEditor();
    const source = screen.getByRole("region", { name: "Markdown source" });

    await user.click(screen.getByRole("tab", { name: "Write" }));
    expect(source).not.toHaveClass("hidden");
    expect(screen.queryByRole("region", { name: "Rendered preview" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Deliver" }));
    expect(source).toHaveClass("hidden");
    expect(screen.getByRole("region", { name: "Rendered preview" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Export" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Markdown source" })).toBe(source);
  });

  it("highlights the open document in the library index and marks unsaved changes", async () => {
    const { id } = await renderEditor();
    const sidebar = index();
    expect(within(sidebar).getByRole("button", { name: "Bug Fix" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    useDocumentsStore.getState().setContent(id, "changed");

    expect(
      await within(sidebar).findByRole("button", { name: "Bug Fix (unsaved changes)" }),
    ).toBeInTheDocument();
  });

  it("shows files outside the library in their own section", async () => {
    await renderEditor(docFile({ path: "/tmp/scratch.md", name: "scratch.md" }));
    const sidebar = index();

    expect(within(sidebar).getByText("Outside library")).toBeInTheDocument();
    expect(within(sidebar).getByRole("button", { name: "scratch" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("/tmp/scratch.md")).toBeInTheDocument();
  });

  it("clears editor status when leaving the editor", async () => {
    const user = userEvent.setup();
    await renderEditor();
    const sidebar = index();

    await user.click(within(sidebar).getByRole("link", { name: "MDExport" }));

    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });
});
