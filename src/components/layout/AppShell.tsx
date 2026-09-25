import { Outlet } from "@tanstack/react-router";
import { StatusBar } from "@/components/layout/StatusBar";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { NoticeBar } from "@/features/notices/NoticeBar";

/** [sidebar 240px] | [notice · page header · content · status line] */
export function AppShell() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <NoticeBar />
        <main className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
