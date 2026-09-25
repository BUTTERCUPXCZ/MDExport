import { RouterProvider } from "@tanstack/react-router";
import type { createAppRouter } from "@/app/router";
import { TooltipProvider } from "@/components/ui/tooltip";

interface AppProps {
  router: ReturnType<typeof createAppRouter>;
}

export function App({ router }: AppProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <RouterProvider router={router} />
    </TooltipProvider>
  );
}
