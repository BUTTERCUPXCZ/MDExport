import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkdownPreview } from "@/features/editor/MarkdownPreview";

const openUrl = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl }));

function renderHtml(html: string) {
  render(<MarkdownPreview preview={{ status: "ready", html }} />);
}

describe("MarkdownPreview", () => {
  afterEach(() => {
    openUrl.mockReset();
  });

  it("renders the HTML from Rust", () => {
    renderHtml("<h1>Bug Fix</h1><p>Details</p>");

    expect(screen.getByRole("heading", { name: "Bug Fix" })).toBeInTheDocument();
  });

  it("opens external links in the system browser instead of navigating", () => {
    renderHtml('<a href="https://example.com">site</a>');

    const notPrevented = fireEvent.click(screen.getByRole("link", { name: "site" }));

    expect(notPrevented).toBe(false);
    expect(openUrl).toHaveBeenCalledWith("https://example.com");
  });

  it("scrolls to in-page anchors without touching the app route", () => {
    renderHtml('<a href="#root-cause">jump</a><h2 id="root-cause">Root Cause</h2>');
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    const notPrevented = fireEvent.click(screen.getByRole("link", { name: "jump" }));

    expect(notPrevented).toBe(false);
    expect(scrollIntoView).toHaveBeenCalled();
    expect(openUrl).not.toHaveBeenCalled();
  });

  it("ignores other links such as relative file paths", () => {
    renderHtml('<a href="other.md">other</a>');

    const notPrevented = fireEvent.click(screen.getByRole("link", { name: "other" }));

    expect(notPrevented).toBe(false);
    expect(openUrl).not.toHaveBeenCalled();
  });

  it("shows an error state", () => {
    render(<MarkdownPreview preview={{ status: "error" }} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Preview failed to render.");
  });
});
