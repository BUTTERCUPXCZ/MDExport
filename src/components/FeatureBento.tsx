import type { ReactNode } from "react";
import {
  AUTH_FLOW_FIND,
  Editor,
  ExportPanel,
  LibraryTree,
  Page,
  Shot,
} from "@/mocks/AppMocks";
import { cn } from "@/lib/utils";

/** A bento tile: product UI on top (most of the tile), one title and one line below. */
function BentoCard({
  title,
  children,
  visual,
  className,
  visualClassName,
}: {
  title: string;
  children: ReactNode;
  visual: ReactNode;
  className?: string;
  visualClassName?: string;
}) {
  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-[20px] border border-line bg-panel transition-colors duration-200 hover:border-line-strong",
        className,
      )}
    >
      <div className={cn("relative overflow-hidden border-b border-line bg-canvas", visualClassName)}>
        {visual}
      </div>
      <div className="px-6 pt-5 pb-6">
        <h3 className="text-xl font-semibold tracking-[-0.015em] text-text">{title}</h3>
        <p className="mt-1.5 max-w-[62ch] text-[15px] leading-relaxed text-text-2">{children}</p>
      </div>
    </article>
  );
}

function Keycap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-line-strong bg-canvas px-2 font-sans text-[13px] font-medium text-text-2 shadow-[inset_0_-1px_0_rgb(0_0_0/0.35)]">
      {children}
    </kbd>
  );
}

const SHORTCUTS: [string, string[]][] = [
  ["Find any document", ["Ctrl", "K"]],
  ["Switch Write / Proof", ["Ctrl", "\\"]],
  ["Export", ["Ctrl", "E"]],
  ["Find and replace", ["Ctrl", "H"]],
  ["Rename", ["F2"]],
];

export function FeatureBento() {
  return (
    <section id="features" className="scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="max-w-[640px]">
          <h2 className="text-[clamp(32px,4.4vw,46px)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance text-text">
            Built for the docs you already write.
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-text-2">
            Handover notes, specs, READMEs and incident write-ups. Keep them as Markdown, ship
            them as documents.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-12 lg:gap-6">
          <BentoCard
            className="md:col-span-5"
            visualClassName="h-[300px]"
            title="Write in Markdown."
            visual={
              <Shot scale={2.35} label="The Markdown editor with the find and replace panel open.">
                <Editor lines={AUTH_FLOW_FIND.slice(0, 16)} find />
              </Shot>
            }
          >
            A focused editor with syntax colors, find and replace, and autosave a second after
            you stop typing.
          </BentoCard>

          <BentoCard
            className="md:col-span-7"
            visualClassName="h-[300px]"
            title="See the page as you type."
            visual={
              <Shot scale={1.7} label="The editor beside the rendered page.">
                <div className="m-work">
                  <Editor />
                  <Page />
                </div>
              </Shot>
            }
          >
            Proof puts the rendered page beside your Markdown and scrolls it with you.
          </BentoCard>

          <BentoCard
            className="md:col-span-7"
            visualClassName="h-[300px]"
            title="Export PDF, Word or HTML."
            visual={
              <Shot scale={1.7} label="The finished page beside the export panel with PDF selected.">
                <div className="m-work">
                  <Page short />
                  <ExportPanel />
                </div>
              </Shot>
            }
          >
            Tables, code blocks and emoji come out the way the preview shows them. Unsaved and
            pasted text included.
          </BentoCard>

          <BentoCard
            className="md:col-span-5"
            visualClassName="h-[300px]"
            title="Your folder is the library."
            visual={
              <Shot scale={3} label="The library tree with the new-item menu open and a folder being named.">
                <LibraryTree menu creating />
              </Shot>
            }
          >
            Every .md file in one tree. Create, rename and trash documents and folders in place.
          </BentoCard>

          <BentoCard
            className="md:col-span-4"
            visualClassName="flex h-[260px] items-center"
            title="Keyboard first."
            visual={
              <ul className="w-full space-y-3 px-6">
                {SHORTCUTS.map(([label, keys]) => (
                  <li key={label} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-text-2">{label}</span>
                    <span className="flex gap-1">
                      {keys.map((key) => (
                        <Keycap key={key}>{key}</Keycap>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            }
          >
            Ctrl+/ lists every shortcut. Ctrl is Cmd on macOS.
          </BentoCard>

          <BentoCard
            className="md:col-span-8"
            visualClassName="flex h-[260px] items-center"
            title="Plain files. Nothing leaves your machine."
            visual={
              <pre className="w-full overflow-hidden px-6 font-mono text-[13px] leading-[1.9] text-text-2">
                <span className="text-muted-foreground">$</span> ls ~/Documents/MDForge/backend/handovers
                {"\n"}
                <span className="text-text">auth-flow.md</span>
                {"   "}
                <span className="text-text">payments.md</span>
                {"\n\n"}
                <span className="text-muted-foreground">$</span> git diff --stat
                {"\n"} backend/handovers/auth-flow.md | 4{" "}
                <span className="text-success">++</span>
                <span className="text-[#ef8a80]">--</span>
                {"\n"} 1 file changed, 2 insertions(+), 2 deletions(-)
              </pre>
            }
          >
            No account and no cloud. Your docs stay .md files you can grep, diff and commit.
            Deletes go to the system trash.
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
