import { Outlet } from "@tanstack/react-router";
import { StatusBar } from "@/components/layout/StatusBar";
import { LibraryIndex } from "@/components/library-index/LibraryIndex";
import { NoticeBar } from "@/features/notices/NoticeBar";

/**
 * [library index 264px] [main: notice + page + status]
 * The index is the only navigation; every page renders in the main column.
 */
export function AppShell() {
  return (
    <div className="flex h-full">
      <LibraryIndex />
      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        <NoticeBar />
        <main className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
