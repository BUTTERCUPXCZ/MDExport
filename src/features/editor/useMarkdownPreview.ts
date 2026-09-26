import { useEffect, useRef, useState } from "react";
import { markdownService } from "@/services/tauri/markdown";

/** Shortest pause after typing before the preview re-renders. */
export const PREVIEW_DEBOUNCE_MS = 120;
/** Longest pause, reached on slow machines or very large documents. */
export const PREVIEW_MAX_DEBOUNCE_MS = 1000;

export type PreviewState =
  { status: "loading" } | { status: "ready"; html: string } | { status: "error" };

/**
 * The pause before the next render adapts to how long the last one took,
 * so slow machines and huge documents render less often instead of lagging.
 */
export function nextDebounce(lastRenderMs: number): number {
  return Math.round(
    Math.min(PREVIEW_MAX_DEBOUNCE_MS, Math.max(PREVIEW_DEBOUNCE_MS, lastRenderMs * 2)),
  );
}

/**
 * Renders Markdown to HTML through Rust, debounced while typing.
 * Responses that arrive out of order are dropped, so the preview never goes backwards.
 * While `enabled` is false (preview hidden) nothing is rendered; the latest
 * text renders as soon as it is shown again.
 */
export function useMarkdownPreview(markdown: string, enabled = true): PreviewState {
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const latestRequest = useRef(0);
  const rendered = useRef<string | null>(null);
  const debounce = useRef(PREVIEW_DEBOUNCE_MS);
  const wasEnabled = useRef(false);

  useEffect(() => {
    // Render at once when the preview first appears; debounce edits after that.
    const justShown = enabled && !wasEnabled.current;
    wasEnabled.current = enabled;
    if (!enabled || rendered.current === markdown) return;
    const delay = justShown || rendered.current === null ? 0 : debounce.current;

    const timer = window.setTimeout(() => {
      const requestId = ++latestRequest.current;
      const started = performance.now();
      markdownService
        .render(markdown)
        .then((html) => {
          debounce.current = nextDebounce(performance.now() - started);
          if (requestId !== latestRequest.current) return;
          rendered.current = markdown;
          setState({ status: "ready", html });
        })
        .catch(() => {
          if (requestId === latestRequest.current) setState({ status: "error" });
        });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [markdown, enabled]);

  return state;
}
