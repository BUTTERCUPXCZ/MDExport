import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appService } from "@/services/tauri/app";
import { documentService } from "@/services/tauri/documents";
import { docFile, renderAt, renderEditor, setupApp } from "@/test/renderApp";

const start = () => within(screen.getByRole("region", { name: "Start" }));

describe("Home", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("shows the library name, start actions and recent documents, newest first", async () => {
    await renderAt("/");

    expect(screen.getByRole("heading", { level: 1, name: "MDForge" })).toBeInTheDocument();
    expect(start().getByRole("button", { name: /^New document\s*Ctrl N$/ })).toBeInTheDocument();
    const names = within(screen.getByRole("region", { name: "Recently edited" }))
      .getAllByRole("button")
      .map((b) => b.textContent);
    expect(names).toHaveLength(4);
    expect(names[0]).toMatch(/^auth-flow/);
    expect(screen.queryByRole("contentinfo")).not.toBeInTheDocument();
  });

  it("offers to start writing when the library is empty", async () => {
    setupApp({ listing: { root: "/lib", folders: [], documents: [], truncated: false } });
    await renderAt("/");

    expect(screen.getByRole("heading", { name: "Nothing here yet" })).toBeInTheDocument();
  });

  it("opens a recent document", async () => {
    const user = userEvent.setup();
    const open = vi
      .spyOn(documentService, "open")
      .mockResolvedValue(
        docFile({ path: "/home/me/Documents/MDForge/backend/api.md", name: "api.md" }),
      );
    const router = await renderAt("/");
    const recent = screen.getByRole("region", { name: "Recently edited" });

    await user.click(within(recent).getByRole("button", { name: /^api/ }));

    expect(open).toHaveBeenCalledWith("/home/me/Documents/MDForge/backend/api.md");
    expect(router.state.location.pathname).toMatch(/^\/editor\//);
  });

  it("New document creates a file in the library and opens it", async () => {
    const user = userEvent.setup();
    const create = vi
      .spyOn(documentService, "create")
      .mockResolvedValue(docFile({ path: "/lib/Untitled.md", name: "Untitled.md", content: "" }));
    const router = await renderAt("/");

    await user.click(start().getByRole("button", { name: /^New document/ }));

    expect(create).toHaveBeenCalledWith(undefined);
    expect(router.state.location.pathname).toMatch(/^\/editor\/[0-9a-f-]{36}$/);
    expect(await screen.findByRole("heading", { level: 1, name: "Untitled" })).toBeInTheDocument();
  });

  it("Open file opens the picked file; cancelling stays on Home", async () => {
    const user = userEvent.setup();
    const openDialog = vi.spyOn(documentService, "openDialog").mockResolvedValueOnce(null);
    const router = await renderAt("/");

    await user.click(start().getByRole("button", { name: /Open file/ }));
    expect(router.state.location.pathname).toBe("/");

    openDialog.mockResolvedValueOnce(docFile());
    await user.click(start().getByRole("button", { name: /Open file/ }));
    expect(screen.getByRole("textbox", { name: "Markdown editor" })).toHaveTextContent("# Bug Fix");
  });

  it("shows file errors in the notice bar", async () => {
    const user = userEvent.setup();
    vi.spyOn(documentService, "openDialog").mockRejectedValue({
      kind: "permissionDenied",
      message: "Permission denied: /root/secret.md",
    });
    await renderAt("/");

    await user.click(start().getByRole("button", { name: /Open file/ }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Couldn't open the file: Permission denied: /root/secret.md",
    );
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a not-found page for unknown routes", async () => {
    await renderAt("/does-not-exist");

    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });
});

describe("Settings", () => {
  beforeEach(() => setupApp());
  afterEach(() => vi.restoreAllMocks());

  it("opens with Ctrl+, and closes with Esc back to the previous page", async () => {
    const user = userEvent.setup();
    const { router } = await renderEditor();
    const editorPath = router.state.location.pathname;

    await user.keyboard("{Control>},{/Control}");
    expect(router.state.location.pathname).toBe("/settings");
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(await screen.findByText("/home/me/Documents/MDForge")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(router.state.location.pathname).toBe(editorPath);
  });

  it("closes to Home when opened directly", async () => {
    const user = userEvent.setup();
    const router = await renderAt("/settings");

    await user.click(screen.getByRole("button", { name: "Close settings" }));

    expect(router.state.location.pathname).toBe("/");
  });

  it("shows the library folder, every keybind and the version from Rust", async () => {
    await renderAt("/settings");

    expect(screen.getAllByRole("region").map((r) => r.getAttribute("aria-label"))).toEqual(
      expect.arrayContaining(["Library folder", "Keyboard shortcuts", "About"]),
    );
    expect(screen.getByText("Quick switcher")).toBeInTheDocument();
    expect(await screen.findByTestId("app-version")).toHaveTextContent("v0.1.0");
  });

  it("leaves the version out when it cannot be loaded", async () => {
    vi.mocked(appService.getInfo).mockRejectedValue(new Error("IPC unavailable"));

    await renderAt("/settings");

    await waitFor(() => expect(screen.getByTestId("app-version")).toBeEmptyDOMElement());
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
