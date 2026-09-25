import { useParams } from "@tanstack/react-router";
import { Code, Columns2, Eye, FileText } from "lucide-react";
import { useCallback, useState } from "react";
import { DocumentActions } from "@/components/layout/DocumentActions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { documentTitle } from "@/features/editor/documentText";
import { draftStore } from "@/features/editor/drafts";
import { MarkdownEditor } from "@/features/editor/MarkdownEditor";
import { MarkdownPreview } from "@/features/editor/MarkdownPreview";
import { useMarkdownPreview } from "@/features/editor/useMarkdownPreview";
import { cn } from "@/lib/utils";

type ViewMode = "editor" | "split" | "preview";

const VIEW_MODES: { mode: ViewMode; label: string; icon: typeof Code }[] = [
  { mode: "editor", label: "Editor only", icon: Code },
  { mode: "split", label: "Split view", icon: Columns2 },
  { mode: "preview", label: "Preview only", icon: Eye },
];

function ViewModeToggle({ value, onChange }: { value: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div role="group" aria-label="View mode" className="flex items-center gap-1">
      {VIEW_MODES.map(({ mode, label, icon: Icon }) => (
        <Tooltip key={mode}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={label}
              aria-pressed={value === mode}
              onClick={() => onChange(mode)}
              className="flex size-7 items-center justify-center rounded-md text-interactive-normal transition-colors hover:bg-surface-hover hover:text-interactive-hover aria-pressed:bg-surface-selected aria-pressed:text-interactive-active"
            >
              <Icon className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function DocumentEditor({ documentId }: { documentId: string }) {
  const [content, setContent] = useState(() => draftStore.get(documentId));
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const preview = useMarkdownPreview(content);

  const onChange = useCallback(
    (value: string) => {
      draftStore.set(documentId, value);
      setContent(value);
    },
    [documentId],
  );

  return (
    <>
      <PageHeader
        icon={<FileText />}
        title={documentTitle(content) ?? "Untitled document"}
        topic="Draft — not saved to disk yet"
        actions={
          <>
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <span aria-hidden className="h-6 w-px bg-surface-selected" />
            <DocumentActions />
          </>
        }
      />
      <div className="flex min-h-0 flex-1">
        <section
          aria-label="Markdown source"
          className={cn("min-w-0 flex-1", viewMode === "preview" && "hidden")}
        >
          <MarkdownEditor initialValue={content} onChange={onChange} />
        </section>
        {viewMode === "split" && <div aria-hidden className="w-px shrink-0 bg-surface-selected" />}
        <section
          aria-label="Rendered preview"
          className={cn("min-w-0 flex-1 overflow-y-auto", viewMode === "editor" && "hidden")}
        >
          <MarkdownPreview preview={preview} />
        </section>
      </div>
    </>
  );
}

export function EditorPage() {
  const { documentId } = useParams({ from: "/shell/editor/$documentId" });
  // Remount per document so the editor starts from that document's content.
  return <DocumentEditor key={documentId} documentId={documentId} />;
}
