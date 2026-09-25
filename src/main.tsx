import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app/App";
import { createAppRouter } from "@/app/router";
import { followSystemTheme } from "@/lib/theme";
import "@/styles/globals.css";

followSystemTheme();

const router = createAppRouter();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App router={router} />
  </React.StrictMode>,
);
