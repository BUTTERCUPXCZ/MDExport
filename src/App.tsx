import { DownloadSection } from "@/components/DownloadSection";
import { FeatureBento } from "@/components/FeatureBento";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { useLatestRelease, useOS } from "@/lib/release";

export function App() {
  const os = useOS();
  const release = useLatestRelease();

  return (
    <>
      <a
        href="#features"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-raised focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <Navbar />
      <main>
        <Hero os={os} version={release.version} />
        <FeatureBento />
        <DownloadSection os={os} release={release} />
      </main>
      <Footer />
    </>
  );
}
