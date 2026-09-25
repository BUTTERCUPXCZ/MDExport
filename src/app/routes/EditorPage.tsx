import { useParams } from "@tanstack/react-router";
import { FileText, SquarePen } from "lucide-react";
import { DocumentActions } from "@/components/layout/DocumentActions";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";

export function EditorPage() {
  const { documentId } = useParams({ from: "/shell/editor/$documentId" });

  return (
    <>
      <PageHeader
        icon={<FileText />}
        title="Untitled document"
        topic={documentId}
        actions={<DocumentActions />}
      />
      <div className="flex-1 overflow-y-auto">
        <EmptyState
          icon={<SquarePen />}
          title="Editor coming soon"
          description="The Markdown editor with live preview is the next step."
        />
      </div>
    </>
  );
}
