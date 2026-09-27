import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Page not found · MDExport");
  return (
    <main className="mx-auto max-w-[1200px] px-5 pt-40 pb-32 sm:px-8">
      <h1 className="text-[40px] leading-tight font-semibold tracking-[-0.03em] text-text">
        Page not found
      </h1>
      <p className="mt-3 text-[17px] text-text-2">This page doesn't exist.</p>
      <div className="mt-8 flex gap-3">
        <Button size="cta" asChild>
          <Link to="/">Back to the home page</Link>
        </Button>
        <Button size="cta" variant="outline" asChild>
          <Link to="/docs">Read the docs</Link>
        </Button>
      </div>
    </main>
  );
}
