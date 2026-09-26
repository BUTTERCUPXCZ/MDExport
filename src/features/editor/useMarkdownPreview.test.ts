import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  nextDebounce,
  PREVIEW_DEBOUNCE_MS,
  PREVIEW_MAX_DEBOUNCE_MS,
  useMarkdownPreview,
} from "@/features/editor/useMarkdownPreview";
import { markdownService } from "@/services/tauri/markdown";

describe("useMarkdownPreview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders immediately on mount, then debounces edits", async () => {
    const render = vi
      .spyOn(markdownService, "render")
      .mockImplementation(async (md) => `<p>${md}</p>`);

    const { result, rerender } = renderHook(({ md }) => useMarkdownPreview(md), {
      initialProps: { md: "a" },
    });
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(result.current).toEqual({ status: "ready", html: "<p>a</p>" });

    rerender({ md: "ab" });
    rerender({ md: "abc" });
    await act(() => vi.advanceTimersByTimeAsync(PREVIEW_DEBOUNCE_MS - 1));
    expect(render).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(render).toHaveBeenCalledTimes(2);
    expect(render).toHaveBeenLastCalledWith("abc");
    expect(result.current).toEqual({ status: "ready", html: "<p>abc</p>" });
  });

  it("ignores responses that arrive out of order", async () => {
    const resolvers: Record<string, (html: string) => void> = {};
    vi.spyOn(markdownService, "render").mockImplementation(
      (md) => new Promise((resolve) => (resolvers[md] = resolve)),
    );

    const { result, rerender } = renderHook(({ md }) => useMarkdownPreview(md), {
      initialProps: { md: "old" },
    });
    await act(() => vi.advanceTimersByTimeAsync(0));
    rerender({ md: "new" });
    await act(() => vi.advanceTimersByTimeAsync(PREVIEW_DEBOUNCE_MS));

    await act(async () => resolvers.new("<p>new</p>"));
    await act(async () => resolvers.old("<p>old</p>"));

    expect(result.current).toEqual({ status: "ready", html: "<p>new</p>" });
  });

  it("reports render errors", async () => {
    vi.spyOn(markdownService, "render").mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useMarkdownPreview("x"));
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(result.current).toEqual({ status: "error" });
  });

  it("renders nothing while hidden, then the latest text at once when shown", async () => {
    const render = vi
      .spyOn(markdownService, "render")
      .mockImplementation(async (md) => `<p>${md}</p>`);

    const { result, rerender } = renderHook(({ md, enabled }) => useMarkdownPreview(md, enabled), {
      initialProps: { md: "a", enabled: false },
    });
    rerender({ md: "ab", enabled: false });
    await act(() => vi.advanceTimersByTimeAsync(PREVIEW_MAX_DEBOUNCE_MS));
    expect(render).not.toHaveBeenCalled();

    rerender({ md: "ab", enabled: true });
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(render).toHaveBeenCalledWith("ab");
    expect(result.current).toEqual({ status: "ready", html: "<p>ab</p>" });
  });

  it("waits longer between renders when rendering is slow", () => {
    expect(nextDebounce(5)).toBe(PREVIEW_DEBOUNCE_MS);
    expect(nextDebounce(200)).toBe(400);
    expect(nextDebounce(5000)).toBe(PREVIEW_MAX_DEBOUNCE_MS);
  });
});
