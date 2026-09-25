import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/app/App";
import { followSystemTheme } from "@/lib/theme";
import "@/styles/globals.css";

followSystemTheme();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
