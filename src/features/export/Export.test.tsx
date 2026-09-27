import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { usePrefsStore } from "@/features/prefs/prefsStore";
import { exportService } from "@/services/tauri/export";
import { docFile, LIBRARY, renderEditor, setupApp } from "@/test/renderApp";

const PATH = `${LIBRARY}/Bug Fix.md`;

const panel = () => within(screen.getByRole("complementary", { name: "Export" }));

async function openDeliver(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("tab", { name: "Deliver" }));
  return panel();
}

describe("Export", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("Deliver offers PDF, Word and HTML, with PDF picked", async () => {
    const user = userEvent.setup();
    await renderEditor();

    const deliver = await openDeliver(user);

    const formats = within(deliver.getByRole("group", { name: "Format" })).getAllByRole("radio");
    expect(formats.map((r) => (r as HTMLInputElement).value)).toEqual(["pdf", "docx", "html"]);
    expect(deliver.getByRole("radio", { name: /PDF document/ })).toBeChecked();
    expect(deliver.getByRole("button", { name: "Export PDF" })).toBeEnabled();
  });

  it("exports the editor's current text, including unsaved or pasted edits", async () => {
    const user = userEvent.setup();
    const exportFn = vi
      .spyOn(exportService, "export")
      .mockResolvedValue({ path: `${LIBRARY}/Bug Fix.pdf`, name: "Bug Fix.pdf" });
    const open = vi.spyOn(exportService, "openExported").mockResolvedValue();
    const { id } = await renderEditor();
    useDocumentsStore.getState().setContent(id, "# Pasted\n\nFrom the clipboard");

    await user.click((await openDeliver(user)).getByRole("button", { name: "Export PDF" }));

    expect(exportFn).toHaveBeenCalledWith(
      "# Pasted\n\nFrom the clipboard",
      "pdf",
      "Bug Fix.md",
      PATH,
      "a4",
    );
    const notice = await screen.findByRole("status", { name: "Notification" });
    expect(notice).toHaveTextContent("Exported Bug Fix.pdf");

    await user.click(within(notice).getByRole("button", { name: "Open" }));
    expect(open).toHaveBeenCalledWith(`${LIBRARY}/Bug Fix.pdf`);
  });

  it("Ctrl+E jumps to Deliver; the picked format is exported", async () => {
    const user = userEvent.setup();
    const exportFn = vi.spyOn(exportService, "export").mockResolvedValue(null);
    await renderEditor();

    await user.keyboard("{Control>}e{/Control}");
    await user.click(panel().getByRole("radio", { name: /Word document/ }));
    await user.click(panel().getByRole("button", { name: "Export Word" }));

    expect(exportFn).toHaveBeenCalledWith(expect.any(String), "docx", "Bug Fix.md", PATH, "a4");
  });

  it("PDF can be one continuous page, and the choice is remembered", async () => {
    const user = userEvent.setup();
    const exportFn = vi.spyOn(exportService, "export").mockResolvedValue(null);
    await renderEditor();
    const deliver = await openDeliver(user);

    expect(deliver.getByRole("radio", { name: "A4" })).toBeChecked();
    await user.click(deliver.getByRole("radio", { name: "Continuous" }));
    expect(deliver.getByText(/never cut mid-content/)).toBeInTheDocument();
    await user.click(deliver.getByRole("button", { name: "Export PDF" }));

    expect(exportFn).toHaveBeenCalledWith(
      expect.any(String),
      "pdf",
      "Bug Fix.md",
      PATH,
      "continuous",
    );
    expect(usePrefsStore.getState().pdfPages).toBe("continuous");

    // Page layout only applies to PDF.
    await user.click(deliver.getByRole("radio", { name: /Word document/ }));
    expect(deliver.queryByRole("radio", { name: "Continuous" })).not.toBeInTheDocument();
  });

  it("cancelling the save dialog shows nothing", async () => {
    const user = userEvent.setup();
    vi.spyOn(exportService, "export").mockResolvedValue(null);
    await renderEditor();
    const deliver = await openDeliver(user);

    await user.click(deliver.getByRole("radio", { name: /HTML page/ }));
    await user.click(deliver.getByRole("button", { name: "Export HTML" }));

    await waitFor(() => expect(deliver.getByRole("button", { name: "Export HTML" })).toBeEnabled());
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

    await user.click((await openDeliver(user)).getByRole("button", { name: "Export PDF" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Export failed: Permission denied: /root/out.pdf",
    );
  });

  it("disables the button while exporting", async () => {
    const user = userEvent.setup();
    let finish!: (value: null) => void;
    vi.spyOn(exportService, "export").mockReturnValue(new Promise((r) => (finish = r)));
    await renderEditor();
    const deliver = await openDeliver(user);

    await user.click(deliver.getByRole("button", { name: "Export PDF" }));

    expect(deliver.getByRole("button", { name: "Exporting…" })).toBeDisabled();
    finish(null);
    await waitFor(() => expect(deliver.getByRole("button", { name: "Export PDF" })).toBeEnabled());
  });

  it("is also available from the quick switcher", async () => {
    const user = userEvent.setup();
    const exportFn = vi.spyOn(exportService, "export").mockResolvedValue(null);
    await renderEditor(docFile());

    await user.keyboard("{Control>}k{/Control}");
    await user.type(screen.getByRole("combobox"), ">export word{Enter}");

    expect(exportFn).toHaveBeenCalledWith(expect.any(String), "docx", "Bug Fix.md", PATH, "a4");
    expect(screen.getByRole("tab", { name: "Deliver" })).toHaveAttribute("aria-selected", "true");
  });
});
