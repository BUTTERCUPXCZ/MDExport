import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app/App";
import { createAppRouter, preloadEditor } from "@/app/router";
import { followSystemTheme } from "@/lib/theme";
import "@/styles/globals.css";

followSystemTheme();

const router = createAppRouter();

// Fetch the editor while the user looks at the library, so opening a document is instant.
const whenIdle = window.requestIdleCallback ?? ((run: () => void) => window.setTimeout(run, 500));
whenIdle(() => void preloadEditor());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App router={router} />
  </React.StrictMode>,
);
