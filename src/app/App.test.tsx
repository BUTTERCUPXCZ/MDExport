import { createMemoryHistory } from "@tanstack/react-router";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { createAppRouter } from "@/app/router";
import { appService } from "@/services/tauri/app";

async function renderAt(path: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [path] }));
  await act(() => router.load());
  render(<App router={router} />);
  return router;
}

describe("App shell", () => {
  beforeEach(() => {
    vi.spyOn(appService, "getInfo").mockResolvedValue({ name: "MDForge", version: "0.1.0" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Home inside the shell with the version from Rust", async () => {
    await renderAt("/");

    expect(screen.getByRole("heading", { level: 1, name: "Home" })).toBeInTheDocument();
    expect(screen.getByText("Welcome to MDForge")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Workspaces" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No document open");
    expect(await screen.findByText("v0.1.0 · Local")).toBeInTheDocument();
  });

  it("shows a fallback when the version cannot be loaded", async () => {
    vi.mocked(appService.getInfo).mockRejectedValue(new Error("IPC unavailable"));

    await renderAt("/");

    expect(await screen.findByTestId("app-version")).toHaveTextContent("Local");
  });

  it("marks the current sidebar item active and navigates on click", async () => {
    const user = userEvent.setup();
    const router = await renderAt("/");
    const sidebar = screen.getByRole("navigation", { name: "Main" });

    expect(within(sidebar).getByRole("link", { name: "Home" })).toHaveAttribute(
      "data-status",
      "active",
    );

    await user.click(within(sidebar).getByRole("link", { name: "Library" }));

    expect(router.state.location.pathname).toBe("/library");
    expect(screen.getByText("No documents yet")).toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Library" })).toHaveAttribute(
      "data-status",
      "active",
    );
    expect(within(sidebar).getByRole("link", { name: "Home" })).not.toHaveAttribute("data-status");
  });

  it("renders the editor placeholder with the document id", async () => {
    await renderAt("/editor/doc-42");

    expect(screen.getByText("doc-42")).toBeInTheDocument();
    expect(screen.getByText("Editor coming soon")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("shows a not-found page for unknown routes", async () => {
    await renderAt("/does-not-exist");

    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });
});

describe("Settings", () => {
  beforeEach(() => {
    vi.spyOn(appService, "getInfo").mockResolvedValue({ name: "MDForge", version: "0.1.0" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens with Ctrl+, and closes with Esc back to the previous page", async () => {
    const user = userEvent.setup();
    const router = await renderAt("/library");

    await user.keyboard("{Control>},{/Control}");
    expect(router.state.location.pathname).toBe("/settings");
    expect(screen.getByRole("heading", { level: 1, name: "Appearance" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Workspaces" })).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(router.state.location.pathname).toBe("/library");
  });

  it("closes to Home when opened directly", async () => {
    const user = userEvent.setup();
    const router = await renderAt("/settings");

    await user.click(screen.getByRole("button", { name: "Close settings" }));

    expect(router.state.location.pathname).toBe("/");
  });

  it("switches between setting sections", async () => {
    const user = userEvent.setup();
    await renderAt("/settings");

    await user.click(screen.getByRole("button", { name: "Export" }));

    expect(screen.getByRole("heading", { level: 1, name: "Export" })).toBeInTheDocument();
    expect(screen.getByText("Default PDF Template")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toHaveAttribute("aria-current", "page");
  });
});
