import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appService } from "@/services/tauri/app";
import { documentService } from "@/services/tauri/documents";
import { docFile, renderAt, setupApp } from "@/test/renderApp";

describe("App shell", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

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
  });

  it("shows a not-found page for unknown routes", async () => {
    await renderAt("/does-not-exist");

    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });
});

describe("Home document commands", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("New document creates a file in the library and opens it", async () => {
    const user = userEvent.setup();
    vi.spyOn(documentService, "create").mockResolvedValue(
      docFile({ path: "/lib/Untitled.md", name: "Untitled.md", content: "" }),
    );
    const router = await renderAt("/");

    await user.click(screen.getByRole("button", { name: "New document" }));

    expect(router.state.location.pathname).toMatch(/^\/editor\/[0-9a-f-]{36}$/);
    expect(screen.getByRole("heading", { level: 1, name: "Untitled" })).toBeInTheDocument();
    const sidebar = screen.getByRole("navigation", { name: "Main" });
    expect(within(sidebar).getByRole("link", { name: "Untitled.md" })).toBeInTheDocument();
  });

  it("Open file opens the picked file", async () => {
    const user = userEvent.setup();
    vi.spyOn(documentService, "openDialog").mockResolvedValue(docFile());
    await renderAt("/");

    await user.click(screen.getByRole("button", { name: "Open file" }));

    expect(screen.getByText("/home/me/Documents/MDForge/Bug Fix.md")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Markdown editor" })).toHaveTextContent("# Bug Fix");
  });

  it("cancelling the Open dialog stays on Home", async () => {
    const user = userEvent.setup();
    vi.spyOn(documentService, "openDialog").mockResolvedValue(null);
    const router = await renderAt("/");

    await user.click(screen.getByRole("button", { name: "Open file" }));

    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows file errors in the notice bar", async () => {
    const user = userEvent.setup();
    vi.spyOn(documentService, "openDialog").mockRejectedValue({
      kind: "permissionDenied",
      message: "Permission denied: /root/secret.md",
    });
    await renderAt("/");

    await user.click(screen.getByRole("button", { name: "Open file" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't open the file: Permission denied: /root/secret.md",
    );
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("Ctrl+N and Ctrl+O work from anywhere", async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(documentService, "create").mockResolvedValue(docFile());
    const openDialog = vi.spyOn(documentService, "openDialog").mockResolvedValue(null);
    await renderAt("/library");

    await user.keyboard("{Control>}o{/Control}");
    expect(openDialog).toHaveBeenCalled();

    await user.keyboard("{Control>}n{/Control}");
    expect(create).toHaveBeenCalled();
  });
});

describe("Settings", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

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

describe("Reserved shortcuts", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it.each(["s", "S", "p"])("Ctrl+%s never reaches the webview's default handler", async (key) => {
    await renderAt("/");

    const event = new KeyboardEvent("keydown", {
      key,
      ctrlKey: true,
      shiftKey: key === "S",
      cancelable: true,
    });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
