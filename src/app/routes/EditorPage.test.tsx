import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { documentService } from "@/services/tauri/documents";
import { markdownService } from "@/services/tauri/markdown";
import { docFile, renderAt, renderEditor, setupApp } from "@/test/renderApp";

const content = (id: string) => useDocumentsStore.getState().documents[id]?.content;

describe("Editor page", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("shows the file's source and rendered preview side by side", async () => {
    await renderEditor();

    expect(screen.getByRole("heading", { level: 1, name: "Bug Fix" })).toBeInTheDocument();
    expect(screen.getByText("/home/me/Documents/MDForge/Bug Fix.md")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Markdown editor" })).toHaveTextContent("# Bug Fix");
    const preview = screen.getByRole("article", { name: "Preview" });
    expect(await within(preview).findByRole("heading", { name: "Bug Fix" })).toBeInTheDocument();
    expect(markdownService.render).toHaveBeenCalledWith("# Bug Fix\n\nDetails");
  });

  it("falls back to the file name when there is no heading", async () => {
    await renderEditor(docFile({ name: "notes.md", content: "plain text" }));

    expect(screen.getByRole("heading", { level: 1, name: "notes" })).toBeInTheDocument();
  });

  it("shows cursor, word count and save state in the status bar", async () => {
    const { id } = await renderEditor();
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Ln 1, Col 1");
    expect(status).toHaveTextContent("3 words");
    expect(status).toHaveTextContent("Saved");

    useDocumentsStore.getState().setContent(id, "# Bug Fix\n\nMore details");

    await waitFor(() => expect(status).toHaveTextContent("Unsaved"));
    expect(screen.getByRole("heading", { level: 1, name: "Bug Fix *" })).toBeInTheDocument();
  });

  it("Ctrl+S saves with the version the editor last saw", async () => {
    const user = userEvent.setup();
    const save = vi.spyOn(documentService, "save").mockResolvedValue({ hash: "v2", modifiedMs: 2 });
    const { id } = await renderEditor();
    useDocumentsStore.getState().setContent(id, "# Bug Fix\n\nEdited");

    await user.keyboard("{Control>}s{/Control}");

    expect(save).toHaveBeenCalledWith(
      "/home/me/Documents/MDForge/Bug Fix.md",
      "# Bug Fix\n\nEdited",
      "v1",
      false,
    );
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Saved"));
  });

  it("Save is disabled until there are unsaved changes", async () => {
    const { id } = await renderEditor();
    expect(screen.getByRole("button", { name: "Save Ctrl+S" })).toBeDisabled();

    useDocumentsStore.getState().setContent(id, "changed");

    await waitFor(() => expect(screen.getByRole("button", { name: "Save Ctrl+S" })).toBeEnabled());
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
      expect(screen.getByRole("status")).toHaveTextContent("Unsaved");
    });
  });

  it("moves the document to trash after confirmation", async () => {
    const user = userEvent.setup();
    const del = vi.spyOn(documentService, "delete").mockResolvedValue();
    const { router } = await renderEditor();

    await user.click(screen.getByRole("button", { name: "Trash" }));
    const dialog = screen.getByRole("alertdialog", { name: "Move “Bug Fix.md” to trash?" });
    await user.click(within(dialog).getByRole("button", { name: "Move to trash" }));

    expect(del).toHaveBeenCalledWith("/home/me/Documents/MDForge/Bug Fix.md");
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
  });

  it("shows a helpful state for documents that are not open", async () => {
    await renderAt("/editor/unknown-id");

    expect(screen.getByText("This document isn't open")).toBeInTheDocument();
  });

  it("switches between editor, split and preview views", async () => {
    const user = userEvent.setup();
    await renderEditor();
    const source = screen.getByRole("region", { name: "Markdown source" });
    const rendered = screen.getByRole("region", { name: "Rendered preview" });

    await user.click(screen.getByRole("button", { name: "Preview" }));
    expect(source).toHaveClass("hidden");
    expect(rendered).not.toHaveClass("hidden");

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(source).not.toHaveClass("hidden");
    expect(rendered).toHaveClass("hidden");
  });

  it("lists open documents in the sidebar with an unsaved marker", async () => {
    const { id } = await renderEditor();
    const sidebar = screen.getByRole("navigation", { name: "Main" });
    expect(within(sidebar).getByRole("link", { name: "Bug Fix.md" })).toBeInTheDocument();
    expect(within(sidebar).queryByLabelText("Unsaved changes")).not.toBeInTheDocument();

    useDocumentsStore.getState().setContent(id, "changed");

    expect(await within(sidebar).findByLabelText("Unsaved changes")).toBeInTheDocument();
  });

  it("clears editor status when leaving the editor", async () => {
    const user = userEvent.setup();
    await renderEditor();
    const sidebar = screen.getByRole("navigation", { name: "Main" });

    await user.click(within(sidebar).getByRole("link", { name: "Library" }));

    expect(screen.getByRole("status")).toHaveTextContent("No document open");
  });
});
