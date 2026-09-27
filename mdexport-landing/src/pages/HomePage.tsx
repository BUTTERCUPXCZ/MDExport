import { DownloadSection } from "@/components/DownloadSection";
import { FeatureBento } from "@/components/FeatureBento";
import { Hero } from "@/components/Hero";
import { useLatestRelease } from "@/lib/release";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export function HomePage() {
  const release = useLatestRelease();
  useDocumentTitle("MDExport: Markdown in, polished documents out");

  return (
    <main>
      <Hero version={release.version} />
      <FeatureBento />
      <DownloadSection release={release} />
    </main>
  );
}
