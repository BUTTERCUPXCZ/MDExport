import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";

const WORKFLOW = [
  ["01", "Write", "Markdown editor with live preview and syntax-highlighted code."],
  ["02", "Organize", "Projects, tags, search and version history."],
  ["03", "Export", "Professional PDF and DOCX for handovers."],
] as const;

export function HomePage() {
  const { newDocument, openDocument } = useDocumentCommands();

  return (
    <>
      <PageHeader title="Home" />
      <div className="flex-1 overflow-y-auto">
        <section className="max-w-4xl px-6 pt-16 pb-12 md:px-12">
          <p className="label">MDForge — local-first Markdown</p>
          <h2 className="mt-4 max-w-3xl text-[44px] leading-[1.05] font-semibold tracking-[-0.035em]">
            Documentation that stays in plain files.
          </h2>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-2">
            Write handovers, bug reports and architecture notes as <code>.md</code> files on your
            own disk. No account, no cloud.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            <Button onClick={() => void newDocument()}>
              New document <Kbd>Ctrl+N</Kbd>
            </Button>
            <Button variant="secondary" onClick={() => void openDocument()}>
              Open file <Kbd>Ctrl+O</Kbd>
            </Button>
          </div>
        </section>

        <ol className="grid border-t md:grid-cols-3">
          {WORKFLOW.map(([index, title, text]) => (
            <li
              key={index}
              className="border-b px-6 py-6 md:border-r md:border-b-0 md:px-12 md:last:border-r-0"
            >
              <p className="font-mono text-[11px] text-accent">{index}</p>
              <h3 className="mt-2 text-[15px] font-semibold">{title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
