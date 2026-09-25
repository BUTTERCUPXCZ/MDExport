import { ComingSoon } from "@/components/layout/ComingSoon";
import { EmptyState } from "@/components/layout/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";

export function LibraryPage() {
  return (
    <>
      <PageHeader
        title="Library"
        actions={
          <ComingSoon label="Search — coming soon">
            <div className="flex h-7 w-56 items-center justify-between border px-2 text-[13px] text-ink-3">
              Search
              <kbd className="font-mono text-[10px]">Ctrl+K</kbd>
            </div>
          </ComingSoon>
        }
      />
      <div className="flex-1 overflow-y-auto">
        <EmptyState
          label="Library — 0 documents"
          title="No documents yet"
          description="Documents you create or open will be listed here, grouped by project and tag."
        />
      </div>
    </>
  );
}
