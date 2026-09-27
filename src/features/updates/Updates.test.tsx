import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDocumentsStore } from "@/features/documents/documentsStore";
import { usePrefsStore } from "@/features/prefs/prefsStore";
import { checkForUpdates, useUpdateStore } from "@/features/updates/updateStore";
import { FIRST_CHECK_DELAY_MS } from "@/features/updates/useUpdateCheck";
import { documentService } from "@/services/tauri/documents";
import { openerService } from "@/services/tauri/opener";
import { RELEASES_URL, releaseUrl, updaterService } from "@/services/tauri/updater";
import { renderAt, renderEditor, setupApp } from "@/test/renderApp";
import type { UpdateInfo } from "@/types/update";

const UPDATE: UpdateInfo = { version: "0.3.3", currentVersion: "0.3.2", notes: null };

const dialog = () => screen.findByRole("alertdialog", { name: "MDExport v0.3.3 is available" });
const queryDialog = () => screen.queryByRole("alertdialog");
const notice = () => screen.findByRole("status", { name: "Notification" });

/** Automatic check, as ~10 s after launch. */
async function autoCheck() {
  await act(() => vi.advanceTimersByTimeAsync(FIRST_CHECK_DELAY_MS));
}

describe("Updates", () => {
  beforeEach(() => setupApp());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("pops up a dialog shortly after launch when a new version is out", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const check = vi.spyOn(updaterService, "check").mockResolvedValue(UPDATE);
    await renderAt("/");
    expect(check).not.toHaveBeenCalled();

    await autoCheck();

    expect(check).toHaveBeenCalledTimes(1);
    const modal = await dialog();
    expect(modal).toHaveTextContent("You have v0.3.2.");
    expect(within(modal).getByRole("button", { name: "Update now" })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Notification" })).not.toBeInTheDocument();
  });

  it("Later closes it; the library button brings it back", async () => {
    const user = userEvent.setup();
    vi.spyOn(updaterService, "check").mockResolvedValue(UPDATE);
    await renderAt("/");
    await act(() => checkForUpdates({ quiet: true }));

    await user.click(within(await dialog()).getByRole("button", { name: "Later" }));
    await waitFor(() => expect(queryDialog()).not.toBeInTheDocument());

    // Once per version per session for automatic checks.
    await act(() => checkForUpdates({ quiet: true }));
    expect(queryDialog()).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Update to v0.3.3" }));
    expect(await dialog()).toBeInTheDocument();
  });

  it("What's new opens the release page", async () => {
    const user = userEvent.setup();
    vi.spyOn(updaterService, "check").mockResolvedValue(UPDATE);
    const open = vi.spyOn(openerService, "openExternal").mockResolvedValue();
    await renderAt("/");
    await act(() => checkForUpdates());

    await user.click(within(await dialog()).getByRole("button", { name: /What's new/ }));

    expect(open).toHaveBeenCalledWith(releaseUrl("0.3.3"));
  });

  it("a skipped version doesn't pop up again, but a manual check still shows it", async () => {
    const user = userEvent.setup();
    vi.spyOn(updaterService, "check").mockResolvedValue(UPDATE);
    await renderAt("/");
    await act(() => checkForUpdates({ quiet: true }));

    await user.click(within(await dialog()).getByRole("button", { name: "Skip this version" }));
    expect(usePrefsStore.getState().skippedVersion).toBe("0.3.3");
    await waitFor(() => expect(queryDialog()).not.toBeInTheDocument());

    // A new session (announced list cleared) still respects the skip.
    act(() => freshSession());
    await act(() => checkForUpdates({ quiet: true }));
    expect(queryDialog()).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update to v0.3.3" })).toBeInTheDocument();

    await act(() => checkForUpdates());
    expect(await dialog()).toBeInTheDocument();
  });

  it("stays quiet when up to date, and doesn't check when turned off", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const check = vi.spyOn(updaterService, "check").mockResolvedValue(null);
    await renderAt("/");
    await autoCheck();
    expect(check).toHaveBeenCalledTimes(1);
    expect(queryDialog()).not.toBeInTheDocument();
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
    expect(await dialog()).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Later" }));
    expect(
      await section.findByRole("button", { name: "Install v0.3.3 and restart" }),
    ).toBeInTheDocument();
    expect(section.getByRole("button", { name: "What's new in v0.3.3" })).toBeInTheDocument();
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

  it("Update now saves open documents, then downloads with progress in the dialog", async () => {
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
    const modal = await dialog();
    await user.click(within(modal).getByRole("button", { name: "Update now" }));

    expect(save).toHaveBeenCalledWith(expect.any(String), "# Bug Fix\n\nUnsaved", "v1", false);
    expect(install).toHaveBeenCalled();
    expect(await within(modal).findByText("Downloading… 42%")).toBeInTheDocument();
    for (const name of ["Skip this version", "Later", "Updating…"]) {
      expect(within(modal).getByRole("button", { name })).toBeDisabled();
    }
  });

  it("doesn't install when unsaved changes can't be saved", async () => {
    const user = userEvent.setup();
    vi.spyOn(updaterService, "check").mockResolvedValue(UPDATE);
    vi.spyOn(documentService, "save").mockRejectedValue({ kind: "io", message: "Disk full" });
    const install = vi.spyOn(updaterService, "install");
    const { id } = await renderEditor();
    act(() => useDocumentsStore.getState().setContent(id, "changed"));

    await act(() => checkForUpdates());
    await user.click(within(await dialog()).getByRole("button", { name: "Update now" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/unsaved changes before updating/),
    );
    expect(install).not.toHaveBeenCalled();
    expect(queryDialog()).not.toBeInTheDocument();
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
    await user.click(within(await dialog()).getByRole("button", { name: "Update now" }));

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

/** Forgets which versions were shown, like a fresh app launch. */
function freshSession() {
  useUpdateStore.setState({ announced: [], dialogOpen: false });
}
