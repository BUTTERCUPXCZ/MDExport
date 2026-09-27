import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { usePrefsStore } from "@/features/prefs/prefsStore";
import { checkForUpdates } from "@/features/updates/updateStore";
import { FIRST_CHECK_DELAY_MS } from "@/features/updates/useUpdateCheck";
import { documentService } from "@/services/tauri/documents";
import { openerService } from "@/services/tauri/opener";
import { RELEASES_URL, updaterService } from "@/services/tauri/updater";
import { renderAt, renderEditor, setupApp } from "@/test/renderApp";
import type { UpdateInfo } from "@/types/update";

const UPDATE: UpdateInfo = { version: "0.3.0", currentVersion: "0.2.0", notes: "- Faster exports" };

const notice = () => screen.findByRole("status", { name: "Notification" });

describe("Updates", () => {
  beforeEach(() => setupApp());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("checks shortly after launch and announces a new version", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const check = vi.spyOn(updaterService, "check").mockResolvedValue(UPDATE);
    await renderAt("/");
    expect(check).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(FIRST_CHECK_DELAY_MS));

    expect(check).toHaveBeenCalledTimes(1);
    expect(await notice()).toHaveTextContent("MDExport v0.3.0 is available.");
    expect(screen.getByRole("button", { name: "Update to v0.3.0" })).toBeInTheDocument();
  });

  it("stays quiet when up to date, and doesn't check when turned off", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const check = vi.spyOn(updaterService, "check").mockResolvedValue(null);
    await renderAt("/");
    await act(() => vi.advanceTimersByTimeAsync(FIRST_CHECK_DELAY_MS));
    expect(check).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status", { name: "Notification" })).not.toBeInTheDocument();

    act(() => usePrefsStore.getState().setAutoUpdateCheck(false));
    await act(() => vi.advanceTimersByTimeAsync(FIRST_CHECK_DELAY_MS * 2));
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("Settings can turn automatic checks off and check by hand", async () => {
    const user = userEvent.setup();
    const check = vi.spyOn(updaterService, "check").mockResolvedValue(null);
    await renderAt("/settings");
    const section = within(screen.getByRole("region", { name: "Updates" }));

    await user.click(section.getByRole("checkbox", { name: /Check for updates automatically/ }));
    expect(usePrefsStore.getState().autoUpdateCheck).toBe(false);

    await user.click(section.getByRole("button", { name: "Check now" }));
    expect(check).toHaveBeenCalled();
    expect(await section.findByText("You have the latest version.")).toBeInTheDocument();

    check.mockResolvedValue(UPDATE);
    await user.click(section.getByRole("button", { name: "Check now" }));
    expect(
      await section.findByRole("button", { name: "Install v0.3.0 and restart" }),
    ).toBeInTheDocument();
    expect(section.getByText("- Faster exports")).toBeInTheDocument();
  });

  it("shows check errors in Settings", async () => {
    const user = userEvent.setup();
    vi.spyOn(updaterService, "check").mockRejectedValue({
      kind: "io",
      message: "Couldn't check for updates: offline",
    });
    await renderAt("/settings");
    const section = within(screen.getByRole("region", { name: "Updates" }));

    await user.click(section.getByRole("button", { name: "Check now" }));

    expect(await section.findByRole("alert")).toHaveTextContent("offline");
  });

  it("saves open documents before installing, and shows download progress", async () => {
    const user = userEvent.setup();
    vi.spyOn(updaterService, "check").mockResolvedValue(UPDATE);
    const save = vi.spyOn(documentService, "save").mockResolvedValue({ hash: "v2", modifiedMs: 2 });
    const install = vi.spyOn(updaterService, "install").mockImplementation(async (onProgress) => {
      expect(save).toHaveBeenCalled();
      onProgress({ downloaded: 42, total: 100 });
      return new Promise<void>(() => {}); // the app restarts
    });
    const { id } = await renderEditor();
    act(() => useDocumentsStore.getState().setContent(id, "# Bug Fix\n\nUnsaved"));

    await act(() => checkForUpdates());
    await user.click(within(await notice()).getByRole("button", { name: "Update" }));

    expect(save).toHaveBeenCalledWith(expect.any(String), "# Bug Fix\n\nUnsaved", "v1", false);
    expect(install).toHaveBeenCalled();
    expect(await screen.findByText("Updating… 42%")).toBeInTheDocument();
  });

  it("doesn't install when unsaved changes can't be saved", async () => {
    const user = userEvent.setup();
    vi.spyOn(updaterService, "check").mockResolvedValue(UPDATE);
    vi.spyOn(documentService, "save").mockRejectedValue({ kind: "io", message: "Disk full" });
    const install = vi.spyOn(updaterService, "install");
    const { id } = await renderEditor();
    act(() => useDocumentsStore.getState().setContent(id, "changed"));

    await act(() => checkForUpdates());
    await user.click(screen.getByRole("button", { name: "Update to v0.3.0" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/unsaved changes before updating/),
    );
    expect(install).not.toHaveBeenCalled();
  });

  it("offers a manual download when installing fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(updaterService, "check").mockResolvedValue(UPDATE);
    vi.spyOn(updaterService, "install").mockRejectedValue({
      kind: "io",
      message: "Couldn't install the update: signature mismatch",
    });
    const open = vi.spyOn(openerService, "openExternal").mockResolvedValue();
    await renderAt("/");

    await act(() => checkForUpdates());
    await user.click(screen.getByRole("button", { name: "Update to v0.3.0" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("signature mismatch");
    await user.click(within(alert).getByRole("button", { name: "Download" }));
    expect(open).toHaveBeenCalledWith(RELEASES_URL);
  });

  it("is also available from the quick switcher", async () => {
    const user = userEvent.setup();
    const check = vi.spyOn(updaterService, "check").mockResolvedValue(null);
    await renderAt("/");

    await user.keyboard("{Control>}k{/Control}");
    await user.type(screen.getByRole("combobox"), ">check for updates");
    await user.keyboard("{Enter}");

    expect(check).toHaveBeenCalled();
    expect(await notice()).toHaveTextContent("MDExport is up to date.");
  });
});
