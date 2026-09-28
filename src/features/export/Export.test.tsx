import { act, screen, waitFor, within } from "@testing-library/react";
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
      .mockResolvedValue({ path: `${LIBRARY}/Bug Fix.pdf`, name: "Bug Fix.pdf", folder: LIBRARY });
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
      expect.any(Function),
    );
    const done = await screen.findByRole("alertdialog", { name: "Export complete" });
    expect(done).toHaveTextContent(`Bug Fix.pdf was saved to ${LIBRARY}.`);

    await user.click(within(done).getByRole("button", { name: "Open PDF" }));
    expect(open).toHaveBeenCalledWith(`${LIBRARY}/Bug Fix.pdf`);
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("Show in folder reveals the exported file; Done closes", async () => {
    const user = userEvent.setup();
    vi.spyOn(exportService, "export").mockResolvedValue({
      path: `${LIBRARY}/Bug Fix.docx`,
      name: "Bug Fix.docx",
      folder: LIBRARY,
    });
    const reveal = vi.spyOn(exportService, "revealExported").mockResolvedValue();
    await renderEditor();
    const deliver = await openDeliver(user);
    await user.click(deliver.getByRole("radio", { name: /Word document/ }));

    await user.click(deliver.getByRole("button", { name: "Export Word" }));
    const done = await screen.findByRole("alertdialog", { name: "Export complete" });
    expect(within(done).getByRole("button", { name: "Open document" })).toBeInTheDocument();
    await user.click(within(done).getByRole("button", { name: "Show in folder" }));
    expect(reveal).toHaveBeenCalledWith(`${LIBRARY}/Bug Fix.docx`);

    await user.click(deliver.getByRole("button", { name: "Export Word" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Done" }),
    );
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("shows progress while converting and saving", async () => {
    const user = userEvent.setup();
    let stage!: (s: "converting" | "saving") => void;
    let finish!: (value: null) => void;
    vi.spyOn(exportService, "export").mockImplementation((...args) => {
      stage = args[5]!;
      return new Promise((r) => (finish = r));
    });
    await renderEditor();

    await user.click((await openDeliver(user)).getByRole("button", { name: "Export PDF" }));
    // The Save dialog is still open: nothing shown yet.
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    act(() => stage("converting"));
    const working = await screen.findByRole("alertdialog", { name: "Exporting PDF…" });
    expect(within(working).getByRole("progressbar")).toBeInTheDocument();
    expect(working).toHaveTextContent("Converting the document…");
    act(() => stage("saving"));
    expect(working).toHaveTextContent("Saving the file…");

    act(() => finish(null));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("Ctrl+E jumps to Deliver; the picked format is exported", async () => {
    const user = userEvent.setup();
    const exportFn = vi.spyOn(exportService, "export").mockResolvedValue(null);
    await renderEditor();

    await user.keyboard("{Control>}e{/Control}");
    await user.click(panel().getByRole("radio", { name: /Word document/ }));
    await user.click(panel().getByRole("button", { name: "Export Word" }));

    expect(exportFn).toHaveBeenCalledWith(
      expect.any(String),
      "docx",
      "Bug Fix.md",
      PATH,
      "a4",
      expect.any(Function),
    );
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
      expect.any(Function),
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
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
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

    const failed = await screen.findByRole("alertdialog", { name: "Export failed" });
    expect(within(failed).getByRole("alert")).toHaveTextContent("Permission denied: /root/out.pdf");
    await user.click(within(failed).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
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

    expect(exportFn).toHaveBeenCalledWith(
      expect.any(String),
      "docx",
      "Bug Fix.md",
      PATH,
      "a4",
      expect.any(Function),
    );
    expect(screen.getByRole("tab", { name: "Deliver" })).toHaveAttribute("aria-selected", "true");
  });
});
