import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { libraryService } from "@/services/tauri/library";
import { LIBRARY, renderAt, setupApp } from "@/test/renderApp";

describe("Library setup", () => {
  afterEach(() => vi.restoreAllMocks());

  it("asks for a library folder on first launch and uses the default", async () => {
    const user = userEvent.setup();
    setupApp({ library: null });
    const useDefault = vi.spyOn(libraryService, "useDefaultLocation").mockResolvedValue(LIBRARY);
    await renderAt("/");

    const dialog = await screen.findByRole("alertdialog", { name: "Choose your library folder" });
    expect(await screen.findByText(LIBRARY)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(dialog).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Use this folder" }));

    expect(useDefault).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
  });

  it("stays open when choosing a folder is cancelled, and shows errors", async () => {
    const user = userEvent.setup();
    setupApp({ library: null });
    vi.spyOn(libraryService, "chooseLocation").mockResolvedValueOnce(null);
    vi.spyOn(libraryService, "useDefaultLocation").mockRejectedValue({
      kind: "permissionDenied",
      message: "Permission denied: /home/me/Documents",
    });
    await renderAt("/");
    await screen.findByRole("alertdialog");

    await user.click(screen.getByRole("button", { name: "Choose folder…" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Use this folder" }));
    expect(await screen.findByText("Permission denied: /home/me/Documents")).toBeInTheDocument();
  });

  it("does not ask when a library is already set, and shows it in Settings", async () => {
    setupApp();
    await renderAt("/settings");

    expect(await screen.findByText(LIBRARY)).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
