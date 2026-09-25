import { useMatchRoute } from "@tanstack/react-router";

export function StatusBar() {
  const matchRoute = useMatchRoute();
  const inEditor = Boolean(matchRoute({ to: "/editor/$documentId" }));

  return (
    <footer
      role="status"
      className="flex h-6 shrink-0 items-center justify-between bg-surface-secondary-alt px-3 text-xs text-text-muted"
    >
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="size-2 rounded-full bg-success" />
        Ready
      </span>
      <span>{inEditor ? "Saved" : "No document open"}</span>
    </footer>
  );
}
