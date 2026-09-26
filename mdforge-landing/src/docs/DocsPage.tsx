import { useEffect, useState } from "react";
import { DOC_SECTIONS, DocsContent } from "@/docs/content";
import { REPO_URL } from "@/lib/release";
import { cn } from "@/lib/utils";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

/** Id of the last section whose heading has scrolled past the top band of the screen. */
function useActiveSection(): string {
  const [active, setActive] = useState<string>(DOC_SECTIONS[0].id);

  useEffect(() => {
    // Cheap (one rect per section), so it runs on every scroll event.
    const update = () => {
      let current: string = DOC_SECTIONS[0].id;
      for (const { id } of DOC_SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      }
      // At the very bottom, the last section is current even if it's short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        current = DOC_SECTIONS[DOC_SECTIONS.length - 1].id;
      }
      setActive(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return active;
}

function Toc({ active, onPick }: { active: string; onPick?: () => void }) {
  return (
    <ul className="space-y-0.5">
      {DOC_SECTIONS.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            onClick={onPick}
            aria-current={active === section.id ? "location" : undefined}
            className={cn(
              "block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-text",
              active === section.id && "bg-accent-soft text-text",
            )}
          >
            {section.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function DocsPage() {
  const active = useActiveSection();
  const [tocOpen, setTocOpen] = useState(false);
  useDocumentTitle("Documentation · MDForge");

  return (
    <main className="mx-auto max-w-[1200px] px-5 pt-28 pb-24 sm:px-8 sm:pt-32">
        <header className="max-w-[72ch]">
          <h1 className="text-[clamp(36px,5vw,52px)] leading-[1.02] font-semibold tracking-[-0.035em] text-text">
            Documentation
          </h1>
          <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-text-2">
            Everything MDForge does, from the first launch to exporting and building it
            yourself. Something missing?{" "}
            <a
              href={`${REPO_URL}/issues`}
              className="text-text underline decoration-line-strong underline-offset-4 hover:decoration-accent"
            >
              Open an issue
            </a>
            .
          </p>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            {/* Phones and tablets: a collapsible list above the content. */}
            <div className="lg:hidden">
              <button
                type="button"
                aria-expanded={tocOpen}
                onClick={() => setTocOpen((open) => !open)}
                className="flex h-11 w-full items-center justify-between rounded-[10px] border border-line bg-panel px-4 text-sm font-medium text-text"
              >
                On this page
                <span className="text-muted-foreground">{tocOpen ? "Hide" : "Show"}</span>
              </button>
              {tocOpen && (
                <div className="mt-2 rounded-[10px] border border-line bg-panel p-2">
                  <Toc active={active} onPick={() => setTocOpen(false)} />
                </div>
              )}
            </div>
            <div className="hidden lg:block">
              <p className="mb-3 px-3 text-sm font-semibold text-text">On this page</p>
              <Toc active={active} />
            </div>
          </nav>

          <article className="min-w-0 max-w-[72ch] space-y-12">
            <DocsContent />
          </article>
        </div>
    </main>
  );
}
