import { useEffect, useState } from "react";
import { appService } from "@/services/tauri/app";
import type { AppInfo } from "@/types/app";

export function App() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    appService
      .getInfo()
      .then(setInfo)
      .catch(() => setError(true));
  }, []);

  return (
    <main className="flex h-screen flex-col items-center justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome to MDForge</h1>
      <p className="text-muted-foreground">Local-first Markdown workspace for developers.</p>
      <p className="font-mono text-xs text-subtle-foreground" data-testid="app-version">
        {error ? "Version unavailable" : info ? `v${info.version}` : " "}
      </p>
    </main>
  );
}
