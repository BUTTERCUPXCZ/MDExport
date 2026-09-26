import { Outlet } from "@tanstack/react-router";
import { ServerRail } from "@/components/layout/ServerRail";
import { StatusBar } from "@/components/layout/StatusBar";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { NoticeBar } from "@/features/notices/NoticeBar";

/**
 * Discord-style layout:
 * [rail 72px] [sidebar 240px] [main: page header + content + status bar]
 */
export function AppShell() {
  return (
    <div className="flex h-full">
      <ServerRail />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-surface-primary">
        <NoticeBar />
        <main className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
        <StatusBar />
      </div>
    </div>
  );
}
