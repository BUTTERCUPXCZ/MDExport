import { useNavigate } from "@tanstack/react-router";
import { FilePlus2, FolderOpen, House } from "lucide-react";
import { ComingSoon } from "@/components/layout/ComingSoon";
import { DocumentActions } from "@/components/layout/DocumentActions";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

export function HomePage() {
  const navigate = useNavigate();

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
              <Button
                onClick={() =>
                  void navigate({
                    to: "/editor/$documentId",
                    params: { documentId: crypto.randomUUID() },
                  })
                }
              >
                <FilePlus2 data-icon="inline-start" />
                New document
              </Button>
              <ComingSoon label="Open file — coming in the next phase">
                <Button variant="secondary" disabled>
                  <FolderOpen data-icon="inline-start" />
                  Open file
                </Button>
              </ComingSoon>
            </>
          }
        />
      </div>
    </>
  );
}
