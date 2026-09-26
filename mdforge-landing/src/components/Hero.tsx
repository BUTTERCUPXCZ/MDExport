import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { AppPreview } from "@/components/AppPreview";
import { GitHubMark } from "@/components/GitHubMark";
import { Button } from "@/components/ui/button";
import { REPO_URL } from "@/lib/release";

const NEXT = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/features", label: "Features" },
  { to: "/docs", label: "Read the docs" },
];

export function Hero({ version }: { version: string | null }) {
  return (
    <section className="pt-28 pb-24 sm:pt-32">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
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
            MDForge is a desktop Markdown workspace for developers. Write next to your code,
            check the real page as you go, and export PDF, Word or HTML from plain{" "}
            <code className="font-mono text-[0.9em] text-text">.md</code> files. Offline, no
            account.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="cta" asChild>
              <Link to="/download">
                Download MDForge
                <ArrowRight />
              </Link>
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

        <div className="mt-12 sm:mt-14">
          <AppPreview stage="proof" />
        </div>

        <nav aria-label="Learn more" className="mt-8">
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {NEXT.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="group inline-flex items-center gap-1.5 text-[15px] font-medium text-text-2 transition-colors duration-150 hover:text-text"
                >
                  {item.label}
                  <ArrowRight className="size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
