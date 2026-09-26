import { DownloadSection } from "@/components/DownloadSection";
import { useLatestRelease } from "@/lib/release";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export function DownloadPage() {
  const release = useLatestRelease();
  useDocumentTitle("Download · MDForge");
  return (
    <main>
      <DownloadSection release={release} />
    </main>
  );
}
