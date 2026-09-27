import { ArrowDown } from "lucide-react";
import { useState } from "react";
import { GitHubMark } from "@/components/GitHubMark";
import { Button } from "@/components/ui/button";
import { AppWindow, Shot, STAGES, type Stage } from "@/mocks/AppMocks";
import { REPO_URL } from "@/lib/release";
import { cn } from "@/lib/utils";

const STAGE_TEXT: Record<Stage, string> = {
  write: "Write. The editor, full width, with find and replace and the shortcuts you know.",
  proof: "Proof. The rendered page beside your Markdown, following your scroll.",
  deliver: "Deliver. The finished page with PDF, Word and HTML export one click away.",
};

export function Hero({ version }: { version: string | null }) {
  const [stage, setStage] = useState<Stage>("proof");

  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-20 sm:pt-32">

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="max-w-[920px]">
          <a
            href={`${REPO_URL}/releases`}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/60 px-3 py-1 text-[13px] text-text-2 transition-colors duration-150 hover:border-line-strong"
          >
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            {version ?? "v0.1.0"} · free and open source
          </a>

          <h1 className="mt-6 text-[clamp(42px,6.6vw,76px)] leading-[0.98] font-semibold tracking-[-0.04em] text-balance text-text">
            Markdown in.
            <br />
            Polished documents out.
          </h1>

          <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed text-text-2 sm:text-lg">
            MDExport is a desktop Markdown workspace for developers. Write next to your code,
            check the real page as you go, and export PDF, Word or HTML from plain{" "}
            <code className="font-mono text-[0.9em] text-text">.md</code> files. Offline, no
            account.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="cta" asChild>
              <a href="#download">
                Download MDExport
                <ArrowDown />
              </a>
            </Button>
            <Button size="cta" variant="outline" asChild>
              <a href={REPO_URL}>
                <GitHubMark className="size-4" />
                View on GitHub
              </a>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Windows · macOS · Linux</p>
        </div>

        <div
          id="how-it-works"
          className="mt-12 scroll-mt-24 sm:mt-14"
          aria-label="How MDExport works"
        >
          {/* On phones the window keeps a readable size and scrolls sideways. */}
          <div className="overflow-x-auto rounded-3xl border border-line-strong">
            <div className="min-w-[760px]">
            <Shot label={`The MDExport window in the ${stage} stage: library on the left, ${
              stage === "write"
                ? "the Markdown editor"
                : stage === "proof"
                  ? "the Markdown editor beside the rendered page"
                  : "the rendered page beside the export panel"
            }.`}>
              <AppWindow stage={stage} />
            </Shot>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              role="group"
              aria-label="Show stage"
              className="flex w-fit rounded-[10px] border border-line bg-panel p-1"
            >
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={stage === s.id}
                  onClick={() => setStage(s.id)}
                  className={cn(
                    "h-9 rounded-md px-4 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-text",
                    stage === s.id && "bg-raised text-text shadow-[0_1px_2px_rgb(0_0_0/0.25)]",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p aria-live="polite" className="text-[15px] text-text-2">
              {STAGE_TEXT[stage]}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
