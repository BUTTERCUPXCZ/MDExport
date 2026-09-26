import { FeatureBento } from "@/components/FeatureBento";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export function FeaturesPage() {
  useDocumentTitle("Features · MDForge");
  return (
    <main>
      <FeatureBento />
    </main>
  );
}
