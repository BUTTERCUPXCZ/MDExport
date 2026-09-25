import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { exportService } from "@/services/tauri/export";
import { docFile, LIBRARY, renderEditor, setupApp } from "@/test/renderApp";

const PATH = `${LIBRARY}/Bug Fix.md`;

describe("Export", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("the header Export menu offers PDF, Word and HTML", async () => {
    const user = userEvent.setup();
    await renderEditor();

    await user.click(screen.getByRole("button", { name: "Export" }));

    const menu = screen.getByRole("menu");
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((i) => i.textContent),
    ).toEqual(["PDF document.pdf", "Word document.docx", "HTML page.html"]);
  });

  it("exports the editor's current text, including unsaved or pasted edits", async () => {
    const user = userEvent.setup();
    const exportFn = vi
      .spyOn(exportService, "export")
      .mockResolvedValue({ path: `${LIBRARY}/Bug Fix.pdf`, name: "Bug Fix.pdf" });
    const open = vi.spyOn(exportService, "openExported").mockResolvedValue();
    const { id } = await renderEditor();
    useDocumentsStore.getState().setContent(id, "# Pasted\n\nFrom the clipboard");

    await user.click(screen.getByRole("button", { name: "Export" }));
    await user.click(screen.getByRole("menuitem", { name: /PDF document/ }));

    expect(exportFn).toHaveBeenCalledWith(
      "# Pasted\n\nFrom the clipboard",
      "pdf",
      "Bug Fix.md",
      PATH,
    );
    const notice = await screen.findByRole("status", { name: "Notification" });
    expect(notice).toHaveTextContent("Exported Bug Fix.pdf");

    await user.click(within(notice).getByRole("button", { name: "Open" }));
    expect(open).toHaveBeenCalledWith(`${LIBRARY}/Bug Fix.pdf`);
  });

  it("Ctrl+E opens the export menu", async () => {
    const user = userEvent.setup();
    const exportFn = vi.spyOn(exportService, "export").mockResolvedValue(null);
    await renderEditor();

    await user.keyboard("{Control>}e{/Control}");
    await user.click(screen.getByRole("menuitem", { name: /Word document/ }));

    expect(exportFn).toHaveBeenCalledWith(expect.any(String), "docx", "Bug Fix.md", PATH);
  });

  it("cancelling the save dialog shows nothing", async () => {
    const user = userEvent.setup();
    vi.spyOn(exportService, "export").mockResolvedValue(null);
    await renderEditor();

    await user.click(screen.getByRole("button", { name: "Export" }));
    await user.click(screen.getByRole("menuitem", { name: /HTML page/ }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Export" })).toBeEnabled());
    expect(screen.queryByRole("status", { name: "Notification" })).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows export errors", async () => {
    const user = userEvent.setup();
    vi.spyOn(exportService, "export").mockRejectedValue({
      kind: "permissionDenied",
      message: "Permission denied: /root/out.pdf",
    });
    await renderEditor();

    await user.click(screen.getByRole("button", { name: "Export" }));
    await user.click(screen.getByRole("menuitem", { name: /PDF document/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Export failed: Permission denied: /root/out.pdf",
    );
  });

  it("disables the button while exporting", async () => {
    const user = userEvent.setup();
    let finish!: (value: null) => void;
    vi.spyOn(exportService, "export").mockReturnValue(new Promise((r) => (finish = r)));
    await renderEditor();

    await user.click(screen.getByRole("button", { name: "Export" }));
    await user.click(screen.getByRole("menuitem", { name: /PDF document/ }));

    expect(screen.getByRole("button", { name: "Exporting…" })).toBeDisabled();
    finish(null);
    await waitFor(() => expect(screen.getByRole("button", { name: "Export" })).toBeEnabled());
  });

  it("is also available from the quick switcher", async () => {
    const user = userEvent.setup();
    const exportFn = vi.spyOn(exportService, "export").mockResolvedValue(null);
    await renderEditor(docFile());

    await user.keyboard("{Control>}k{/Control}");
    await user.type(screen.getByRole("combobox"), ">export word{Enter}");

    expect(exportFn).toHaveBeenCalledWith(expect.any(String), "docx", "Bug Fix.md", PATH);
  });
});
