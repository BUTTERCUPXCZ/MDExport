import { Outlet } from "@tanstack/react-router";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

export function RootLayout() {
  useGlobalShortcuts();
  return <Outlet />;
}
