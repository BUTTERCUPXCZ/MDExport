import { BrowserRouter, Route, Routes } from "react-router";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ScrollManager } from "@/components/ScrollManager";
import { DocsPage } from "@/docs/DocsPage";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** One React app, two pages: the landing page (/) and the docs (/docs). */
export function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-raised focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Navbar />
      <div id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <Footer />
    </BrowserRouter>
  );
}
