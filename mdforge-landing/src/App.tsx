import { BrowserRouter, Route, Routes } from "react-router";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ScrollManager } from "@/components/ScrollManager";
import { DocsPage } from "@/docs/DocsPage";
import { DownloadPage } from "@/pages/DownloadPage";
import { FeaturesPage } from "@/pages/FeaturesPage";
import { HomePage } from "@/pages/HomePage";
import { HowItWorksPage } from "@/pages/HowItWorksPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** One React app: home, how it works, features, download and docs, each its own route. */
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
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/download" element={<DownloadPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <Footer />
    </BrowserRouter>
  );
}
