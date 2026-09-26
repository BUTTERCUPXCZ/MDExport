import { Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="This page doesn't exist."
      actions={
        <Button asChild>
          <Link to="/">Back to the library</Link>
        </Button>
      }
    />
  );
}
