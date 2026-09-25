import { useEffect, useRef, useState } from "react";
import { markdownService } from "@/services/tauri/markdown";

export const PREVIEW_DEBOUNCE_MS = 120;

export type PreviewState =
  { status: "loading" } | { status: "ready"; html: string } | { status: "error" };

/**
 * Renders Markdown to HTML through Rust, debounced while typing.
 * Responses that arrive out of order are dropped, so the preview never goes backwards.
 */
export function useMarkdownPreview(markdown: string): PreviewState {
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const latestRequest = useRef(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const delay = isFirstRender.current ? 0 : PREVIEW_DEBOUNCE_MS;
    isFirstRender.current = false;

    const timer = window.setTimeout(() => {
      const requestId = ++latestRequest.current;
      markdownService
        .render(markdown)
        .then((html) => {
          if (requestId === latestRequest.current) setState({ status: "ready", html });
        })
        .catch(() => {
          if (requestId === latestRequest.current) setState({ status: "error" });
        });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [markdown]);

  return state;
}
