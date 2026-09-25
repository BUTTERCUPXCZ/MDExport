import { Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/layout/EmptyState";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <EmptyState
      label="Error 404"
      title="Page not found"
      description="This page doesn't exist."
      actions={
        <Button asChild>
          <Link to="/">Go home</Link>
        </Button>
      }
    />
  );
}
