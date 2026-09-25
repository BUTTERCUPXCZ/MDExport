import { FileText, LibraryBig, Search } from "lucide-react";
import { ComingSoon } from "@/components/layout/ComingSoon";
import { DocumentActions } from "@/components/layout/DocumentActions";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";

export function LibraryPage() {
  return (
    <>
      <PageHeader
        icon={<LibraryBig />}
        title="Library"
        topic="All your documents"
        actions={
          <>
            <ComingSoon label="Search — coming soon">
              <div className="flex h-6 w-36 items-center justify-between rounded-sm bg-surface-tertiary px-1.5 text-sm text-text-muted">
                Search
                <Search className="size-4" />
              </div>
            </ComingSoon>
            <DocumentActions />
          </>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <EmptyState
          icon={<FileText />}
          title="No documents yet"
          description="Documents you create or open will show up here, grouped by project and tag."
        />
      </div>
    </>
  );
}
