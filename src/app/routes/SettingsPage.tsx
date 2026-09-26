import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { refreshLibrary } from "@/features/library/libraryStore";
import { useLibraryLocation } from "@/features/library/useLibraryLocation";
import { showError } from "@/features/notices/noticeStore";
import { usePrefsStore } from "@/features/prefs/prefsStore";
import { ShortcutList } from "@/features/shortcuts/ShortcutsDialog";
import { appService } from "@/services/tauri/app";
import { libraryService } from "@/services/tauri/library";
import { toAppError } from "@/types/document";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="border-t border-line py-7 first:border-t-0 first:pt-0">
      <h2 className="text-[15px] font-semibold text-text">{title}</h2>
      {description && <p className="mt-1 text-[13px] text-text-2">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function LibrarySection() {
  const location = useLibraryLocation((s) => s.location);
  const setLocation = useLibraryLocation((s) => s.set);

  const change = async () => {
    try {
      const chosen = await libraryService.chooseLocation();
      if (chosen) {
        setLocation(chosen);
        void refreshLibrary();
      }
    } catch (e) {
      showError(`Couldn't change the library folder: ${toAppError(e).message}`);
    }
  };

  return (
    <Section
      title="Library folder"
      description="MDForge lists every Markdown file in this folder and its subfolders. New documents are created here."
    >
      <div className="flex items-center gap-3">
        <code className="min-w-0 flex-1 rounded-md border border-line bg-sunken px-3 py-2 font-mono text-[12.5px] break-all text-text">
          {location || "Not set"}
        </code>
        <Button variant="secondary" onClick={() => void change()}>
          Change…
        </Button>
      </div>
    </Section>
  );
}

function EditingSection() {
  const autosave = usePrefsStore((s) => s.autosave);
  const setAutosave = usePrefsStore((s) => s.setAutosave);

  return (
    <Section title="Editing">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={autosave}
          onChange={(e) => setAutosave(e.target.checked)}
          className="mt-0.5 size-4 accent-(--accent)"
        />
        <span>
          <span className="block text-[13.5px] text-text">Save automatically</span>
          <span className="block text-[12.5px] text-text-2">
            Saves a second after you stop typing, and before the app closes.
          </span>
        </span>
      </label>
    </Section>
  );
}

function AboutSection() {
  const [version, setVersion] = useState<string | null>(null);
  useEffect(() => {
    appService.getInfo().then(
      (info) => setVersion(info.version),
      () => setVersion(null),
    );
  }, []);

  return (
    <Section title="About">
      <p className="text-[13px] text-text">
        MDForge <span data-testid="app-version">{version ? `v${version}` : ""}</span>
      </p>
      <p className="mt-1 text-[13px] text-text-2">
        Your documents stay plain .md files on your disk. Nothing leaves this computer.
      </p>
    </Section>
  );
}

/** Settings, shown in the main column. Esc closes it. */
export function SettingsPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();

  const close = useCallback(() => {
    if (canGoBack) router.history.back();
    else void navigate({ to: "/" });
  }, [canGoBack, navigate, router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return (
    <>
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-line px-4">
        <h1 className="text-[14.5px] font-semibold text-text">Settings</h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Close settings" onClick={close}>
              <X />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Close (Esc)</TooltipContent>
        </Tooltip>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[680px] px-8 py-8">
          <LibrarySection />
          <EditingSection />
          <Section title="Keyboard shortcuts">
            <ShortcutList />
          </Section>
          <AboutSection />
        </div>
      </div>
    </>
  );
}
