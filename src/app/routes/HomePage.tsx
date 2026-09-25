import { FilePlus2, FolderOpen, House } from "lucide-react";
import { DocumentActions } from "@/components/layout/DocumentActions";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useDocumentCommands } from "@/features/documents/useDocumentCommands";

export function HomePage() {
  const { newDocument, openDocument } = useDocumentCommands();

  return (
    <>
      <PageHeader
        icon={<House />}
        title="Home"
        topic="Local-first Markdown workspace"
        actions={<DocumentActions />}
      />
      <div className="flex-1 overflow-y-auto">
        <EmptyState
          icon={<FilePlus2 />}
          title="Welcome to MDForge"
          description="Create, organize, and export developer documentation. Everything stays on your machine as plain .md files."
          actions={
            <>
              <Button onClick={() => void newDocument()}>
                <FilePlus2 data-icon="inline-start" />
                New document
              </Button>
              <Button variant="secondary" onClick={() => void openDocument()}>
                <FolderOpen data-icon="inline-start" />
                Open file
              </Button>
            </>
          }
        />
        <p className="-mt-6 text-center text-xs text-text-muted">
          <kbd className="font-mono">Ctrl+N</kbd> new · <kbd className="font-mono">Ctrl+O</kbd> open
        </p>
      </div>
    </>
  );
}
