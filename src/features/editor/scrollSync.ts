/** A preview element and the source line it starts on. */
export interface Anchor {
  line: number;
  /** Offset from the top of the scroll container's content, in px. */
  top: number;
}

/** Where each `data-sourcepos` element sits in the preview (see Rust `render_preview_html`). */
export function collectAnchors(container: HTMLElement): Anchor[] {
  const base = container.getBoundingClientRect().top - container.scrollTop;
  const raw: Anchor[] = [];
  container.querySelectorAll<HTMLElement>("[data-sourcepos]").forEach((el) => {
    const line = Number.parseInt(el.dataset.sourcepos ?? "", 10);
    if (Number.isFinite(line)) raw.push({ line, top: el.getBoundingClientRect().top - base });
  });
  return monotonic(raw);
}

/** Sorted by line, one anchor per line, positions never going backwards. */
export function monotonic(anchors: Anchor[]): Anchor[] {
  const sorted = [...anchors].sort((a, b) => a.line - b.line || a.top - b.top);
  const out: Anchor[] = [];
  for (const anchor of sorted) {
    const last = out[out.length - 1];
    if (last && (anchor.line === last.line || anchor.top < last.top)) continue;
    out.push(anchor);
  }
  return out;
}

/** Space kept above the matched block, so its first line isn't glued to the edge. */
const MARGIN = 16;

/**
 * Preview scroll position for a (fractional) source line: interpolates between
 * the blocks around it. `Infinity` means the editor is at the end.
 */
export function previewScrollFor(line: number, anchors: Anchor[], maxScroll: number): number {
  if (line === Infinity) return maxScroll;
  const clamp = (y: number) => Math.min(Math.max(y, 0), maxScroll);
  let i = -1;
  while (i + 1 < anchors.length && anchors[i + 1]!.line <= line) i++;
  if (i === -1) return 0;
  const current = anchors[i]!;
  const next = anchors[i + 1];
  if (!next) return clamp(current.top - MARGIN);
  const t = (line - current.line) / (next.line - current.line);
  return clamp(current.top + t * (next.top - current.top) - MARGIN);
}
