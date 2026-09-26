import { Link2 } from "lucide-react";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Keycap } from "@/components/Keycap";

/** A docs section: an h2 with a hover anchor link, then its content. */
export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-line pt-12 first:border-t-0 first:pt-0">
      <h2
        id={`${id}-title`}
        className="group flex items-center gap-2 text-[28px] leading-tight font-semibold tracking-[-0.025em] text-text"
      >
        {title}
        <a
          href={`#${id}`}
          aria-label={`Link to ${title}`}
          className="text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Link2 className="size-4" />
        </a>
      </h2>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="pt-3 text-lg font-semibold tracking-[-0.01em] text-text">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="max-w-[60ch] text-[15.5px] leading-[1.7] text-text-2">{children}</p>;
}

export function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="max-w-[60ch] list-disc space-y-2 pl-5 text-[15.5px] leading-[1.7] text-text-2 marker:text-muted-foreground">
      {children}
    </ul>
  );
}

export function OL({ children }: { children: ReactNode }) {
  return (
    <ol className="max-w-[60ch] list-decimal space-y-2 pl-5 text-[15.5px] leading-[1.7] text-text-2 marker:text-muted-foreground">
      {children}
    </ol>
  );
}

/** Inline code. */
export function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[5px] border border-line bg-canvas px-1.5 py-px font-mono text-[0.86em] text-text">
      {children}
    </code>
  );
}

/** Bold UI label, e.g. a button or menu item name. */
export function UI({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-text">{children}</strong>;
}

export function Keys({ keys }: { keys: readonly string[] }) {
  return (
    <span className="inline-flex translate-y-[-1px] gap-1 align-middle">
      {keys.map((key) => (
        <Keycap key={key}>{key}</Keycap>
      ))}
    </span>
  );
}

/** Code block with a copy button. */
export function Pre({ children, label }: { children: string; label?: string }) {
  return (
    <div className="relative rounded-[14px] border border-line bg-canvas">
      {label && (
        <div className="border-b border-line px-5 py-2 font-mono text-xs text-muted-foreground">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto px-5 py-4 pr-14 font-mono text-[13px] leading-[1.8] text-text-2">
        {children}
      </pre>
      <CopyButton text={children} />
    </div>
  );
}

/** A plain aside for caveats: a bordered note, no colored stripe. */
export function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-line bg-panel px-5 py-4">
      <p className="text-[15px] font-semibold text-text">{title}</p>
      <div className="mt-1 max-w-[60ch] text-[15px] leading-[1.65] text-text-2">{children}</div>
    </div>
  );
}

export function Table({
  head,
  rows,
  widths,
}: {
  head: string[];
  rows: ReactNode[][];
  /** Fixed column widths (e.g. ["60%", "40%"]), so stacked tables line up. */
  widths?: string[];
}) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-line">
      <table className={`w-full border-collapse text-left text-[14.5px] ${widths ? "table-fixed" : ""}`}>
        <thead className="bg-panel">
          <tr>
            {head.map((cell, i) => (
              <th
                key={cell}
                style={widths ? { width: widths[i] } : undefined}
                className="border-b border-line px-4 py-2.5 font-semibold text-text"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 align-top text-text-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
