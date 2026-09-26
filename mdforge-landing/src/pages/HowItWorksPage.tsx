import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { StageDemo } from "@/components/AppPreview";
import { Keycap } from "@/components/Keycap";
import { PageIntro } from "@/components/PageIntro";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

const CAPTIONS = {
  write: "Write: the editor, full width, with find and replace and the shortcuts you know.",
  proof: "Proof: the rendered page beside your Markdown, following your scroll.",
  deliver: "Deliver: the finished page with PDF, Word and HTML export one click away.",
};

const STEPS: { title: string; keys: string[]; body: string }[] = [
  {
    title: "Write",
    keys: ["Ctrl", "\\"],
    body: "Open a document from the library or paste Markdown into a new one. The editor has syntax colors, find and replace, and saves a second after you stop typing.",
  },
  {
    title: "Proof",
    keys: ["Ctrl", "\\"],
    body: "The page renders beside your text as it will be exported, and scrolls with the editor. Check tables, code blocks and headings before anyone else sees them.",
  },
  {
    title: "Deliver",
    keys: ["Ctrl", "E"],
    body: "Pick PDF, Word or HTML and export. Unsaved and pasted text is included, so there's no save-then-export dance.",
  },
];

export function HowItWorksPage() {
  useDocumentTitle("How it works · MDForge");

  return (
    <main className="mx-auto max-w-[1200px] px-5 pt-28 pb-24 sm:px-8 sm:pt-32">
      <PageIntro title="How it works">
        Every document moves through three stages. Switch them below to see each one.
      </PageIntro>

      <div className="mt-12">
        <StageDemo captions={CAPTIONS} />
      </div>

      <ol className="mt-20 grid gap-10 md:grid-cols-3 md:gap-8">
        {STEPS.map((step, index) => (
          <li key={step.title}>
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
              <h2 className="text-xl font-semibold tracking-[-0.015em] text-text">
                <span className="mr-2 font-mono text-[15px] font-normal text-muted-foreground">
                  {index + 1}
                </span>
                {step.title}
              </h2>
              <span className="flex gap-1">
                {step.keys.map((key) => (
                  <Keycap key={key}>{key}</Keycap>
                ))}
              </span>
            </div>
            <p className="mt-4 text-[15.5px] leading-[1.7] text-text-2">{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-16 flex flex-wrap gap-3">
        <Button size="cta" asChild>
          <Link to="/download">
            Download MDForge
            <ArrowRight />
          </Link>
        </Button>
        <Button size="cta" variant="outline" asChild>
          <Link to="/features">See all features</Link>
        </Button>
      </div>
    </main>
  );
}
