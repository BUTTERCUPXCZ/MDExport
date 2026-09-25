import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  type RouterHistory,
} from "@tanstack/react-router";
import { RootLayout } from "@/app/RootLayout";
import { EditorPage } from "@/app/routes/EditorPage";
import { HomePage } from "@/app/routes/HomePage";
import { FolderPage } from "@/app/routes/FolderPage";
import { NotFoundPage } from "@/app/routes/NotFoundPage";
import { SettingsPage } from "@/app/routes/SettingsPage";
import { AppShell } from "@/components/layout/AppShell";

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

/** Pathless layout route: everything except Settings renders inside the app shell. */
const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "shell",
  component: AppShell,
});

const homeRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/",
  component: HomePage,
});

const folderRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/folder/$folder",
  component: FolderPage,
});

const editorRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/editor/$documentId",
  component: EditorPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([homeRoute, folderRoute, editorRoute]),
  settingsRoute,
]);

/**
 * Hash history: the app is served from Tauri's custom protocol, where deep
 * paths like /folder/x would not resolve to index.html on reload.
 */
export function createAppRouter(history: RouterHistory = createHashHistory()) {
  return createRouter({ routeTree, history });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
