import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DocsPage } from "@/docs/DocsPage";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DocsPage />
  </StrictMode>,
);
