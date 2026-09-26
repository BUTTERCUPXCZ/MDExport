import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  type RouterHistory,
} from "@tanstack/react-router";
import { RootLayout } from "@/app/RootLayout";
import { HomePage } from "@/app/routes/HomePage";
import { NotFoundPage } from "@/app/routes/NotFoundPage";
import { SettingsPage } from "@/app/routes/SettingsPage";
import { AppShell } from "@/components/layout/AppShell";

const editorPage = lazyRouteComponent(() => import("@/app/routes/EditorPage"), "EditorPage");

/** Loads the editor chunk ahead of time (called once the app is idle). */
export const preloadEditor = () => editorPage.preload?.();

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

/** Pathless layout route: every page renders inside the app shell. */
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

const editorRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/editor/$documentId",
  // The editor (CodeMirror + language data) loads on first use, so startup
  // only parses what the library home needs.
  component: editorPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: "/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([homeRoute, editorRoute, settingsRoute]),
]);

/**
 * Hash history: the app is served from Tauri's custom protocol, where deep
 * paths like /editor/x would not resolve to index.html on reload.
 */
export function createAppRouter(history: RouterHistory = createHashHistory()) {
  return createRouter({ routeTree, history });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
