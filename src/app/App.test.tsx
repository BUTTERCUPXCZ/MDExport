import { createMemoryHistory } from "@tanstack/react-router";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/app/App";
import { createAppRouter } from "@/app/router";
import { draftStore } from "@/features/editor/drafts";
import { appService } from "@/services/tauri/app";
import { markdownService } from "@/services/tauri/markdown";

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

  it("opens a new document in the editor from Home", async () => {
    const user = userEvent.setup();
    vi.spyOn(markdownService, "render").mockResolvedValue("");
    const router = await renderAt("/");

    await user.click(screen.getByRole("button", { name: "New document" }));

    expect(router.state.location.pathname).toMatch(/^\/editor\/[0-9a-f-]{36}$/);
    expect(
      screen.getByRole("heading", { level: 1, name: "Untitled document" }),
    ).toBeInTheDocument();
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

describe("Editor", () => {
  beforeEach(() => {
    vi.spyOn(appService, "getInfo").mockResolvedValue({ name: "MDForge", version: "0.1.0" });
    vi.spyOn(markdownService, "render").mockImplementation(async (md) =>
      md.startsWith("# ") ? `<h1>${md.slice(2).split("\n")[0]}</h1>` : "",
    );
  });

  afterEach(() => {
    draftStore.clear();
    vi.restoreAllMocks();
  });

  it("shows the Markdown source and its rendered preview side by side", async () => {
    draftStore.set("doc-1", "# Bug Fix\n\nDetails");
    await renderAt("/editor/doc-1");

    expect(screen.getByRole("heading", { level: 1, name: "Bug Fix" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Markdown editor" })).toHaveTextContent("# Bug Fix");
    const preview = screen.getByRole("article", { name: "Preview" });
    expect(await within(preview).findByRole("heading", { name: "Bug Fix" })).toBeInTheDocument();
    expect(markdownService.render).toHaveBeenCalledWith("# Bug Fix\n\nDetails");
  });

  it("shows cursor position, word count and unsaved state in the status bar", async () => {
    draftStore.set("doc-1", "# Bug Fix\n\nDetails");
    await renderAt("/editor/doc-1");

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Ln 1, Col 1");
    expect(status).toHaveTextContent("3 words");
    expect(status).toHaveTextContent("Not saved");
  });

  it("switches between editor, split and preview views", async () => {
    const user = userEvent.setup();
    await renderAt("/editor/doc-1");
    const source = screen.getByRole("region", { name: "Markdown source" });
    const rendered = screen.getByRole("region", { name: "Rendered preview" });

    expect(screen.getByRole("button", { name: "Split view" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Preview only" }));
    expect(source).toHaveClass("hidden");
    expect(rendered).not.toHaveClass("hidden");

    await user.click(screen.getByRole("button", { name: "Editor only" }));
    expect(source).not.toHaveClass("hidden");
    expect(rendered).toHaveClass("hidden");
  });

  it("clears editor status when leaving the editor", async () => {
    const user = userEvent.setup();
    await renderAt("/editor/doc-1");
    const sidebar = screen.getByRole("navigation", { name: "Main" });

    await user.click(within(sidebar).getByRole("link", { name: "Library" }));

    expect(screen.getByRole("status")).toHaveTextContent("No document open");
  });
});

describe("Reserved shortcuts", () => {
  it.each(["s", "S", "p"])("Ctrl+%s never reaches the webview's default handler", async (key) => {
    vi.spyOn(appService, "getInfo").mockResolvedValue({ name: "MDForge", version: "0.1.0" });
    await renderAt("/");

    const event = new KeyboardEvent("keydown", {
      key,
      ctrlKey: true,
      shiftKey: key === "S",
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    vi.restoreAllMocks();
  });
});
