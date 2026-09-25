import type { MouseEvent } from "react";
import type { PreviewState } from "@/features/editor/useMarkdownPreview";
import { openerService } from "@/services/tauri/opener";

interface MarkdownPreviewProps {
  preview: PreviewState;
}

/**
 * Shows HTML rendered by Rust. The HTML is safe to inject: raw HTML in the
 * Markdown is omitted and dangerous URLs are dropped (see src-tauri/src/markdown).
 */
export function MarkdownPreview({ preview }: MarkdownPreviewProps) {
  // Links never navigate the app window: external ones open in the system
  // browser, in-page anchors scroll the preview, anything else is ignored.
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as HTMLElement).closest("a");
    const href = link?.getAttribute("href");
    if (!link || href === null || href === undefined) return;

    event.preventDefault();
    if (href.startsWith("#")) {
      const target = document.getElementById(decodeURIComponent(href.slice(1)));
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (openerService.isExternalUrl(href)) {
      void openerService.openExternal(href);
    }
  };

  if (preview.status === "error") {
    return (
      <p role="alert" className="p-10 font-mono text-[12px] text-danger">
        Preview failed to render.
      </p>
    );
  }

  return (
    <article
      aria-label="Preview"
      aria-busy={preview.status === "loading"}
      className="markdown-preview mx-auto max-w-[72ch] px-10 py-12"
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: preview.status === "ready" ? preview.html : "" }}
    />
  );
}
