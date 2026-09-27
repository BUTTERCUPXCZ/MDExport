import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { windowService } from "@/services/tauri/window";
import { docFile, renderAt, renderEditor, setupApp } from "@/test/renderApp";

const controls = () => screen.getByRole("group", { name: "Window controls" });

describe("TitleBar", () => {
  let resized: () => void = () => {};

  beforeEach(() => {
    setupApp();
    vi.spyOn(windowService, "isMaximized").mockResolvedValue(false);
    vi.spyOn(windowService, "onResized").mockImplementation(async (callback) => {
      resized = callback;
      return () => {};
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it("shows the app name, is draggable, and names the open document", async () => {
    await renderEditor(docFile({ name: "auth-flow.md" }));

    const bar = controls().closest("header")!;
    expect(bar).toHaveAttribute("data-tauri-drag-region");
    expect(within(bar).getByText("MDExport")).toBeInTheDocument();
    expect(within(bar).getByText("auth-flow")).toBeInTheDocument();
  });

  it("minimizes, maximizes and closes the window", async () => {
    const user = userEvent.setup();
    const minimize = vi.spyOn(windowService, "minimize").mockResolvedValue();
    const toggle = vi.spyOn(windowService, "toggleMaximize").mockResolvedValue();
    const close = vi.spyOn(windowService, "close").mockResolvedValue();
    await renderAt("/");

    await user.click(within(controls()).getByRole("button", { name: "Minimize" }));
    await user.click(within(controls()).getByRole("button", { name: "Maximize" }));
    await user.click(within(controls()).getByRole("button", { name: "Close" }));

    expect(minimize).toHaveBeenCalled();
    expect(toggle).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it("switches to a Restore button when the window is maximized", async () => {
    await renderAt("/");
    expect(within(controls()).getByRole("button", { name: "Maximize" })).toBeInTheDocument();

    vi.mocked(windowService.isMaximized).mockResolvedValue(true);
    resized();

    await waitFor(() =>
      expect(within(controls()).getByRole("button", { name: "Restore" })).toBeInTheDocument(),
    );
  });

  it("keeps working outside the desktop app", async () => {
    vi.mocked(windowService.isMaximized).mockRejectedValue(new Error("no Tauri"));
    vi.mocked(windowService.onResized).mockRejectedValue(new Error("no Tauri"));

    await renderAt("/");

    expect(within(controls()).getByRole("button", { name: "Maximize" })).toBeInTheDocument();
  });
});
