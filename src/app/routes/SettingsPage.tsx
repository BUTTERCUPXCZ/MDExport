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
import { useUpdateStore } from "@/features/updates/updateStore";
import { appService } from "@/services/tauri/app";
import { libraryService } from "@/services/tauri/library";
import { openerService } from "@/services/tauri/opener";
import { releaseUrl } from "@/services/tauri/updater";
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
      description="MDExport lists every Markdown file in this folder and its subfolders. New documents are created here."
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
        MDExport <span data-testid="app-version">{version ? `v${version}` : ""}</span>
      </p>
      <p className="mt-1 text-[13px] text-text-2">
        Your documents stay plain .md files on your disk and never leave this computer. The only
        thing MDExport asks the internet is whether a new version is out.
      </p>
    </Section>
  );
}

function UpdatesSection() {
  const autoCheck = usePrefsStore((s) => s.autoUpdateCheck);
  const setAutoCheck = usePrefsStore((s) => s.setAutoUpdateCheck);
  const { status, info, progress, error, check, install } = useUpdateStore();

  return (
    <Section title="Updates">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={autoCheck}
          onChange={(e) => setAutoCheck(e.target.checked)}
          className="mt-0.5 size-4 accent-(--accent)"
        />
        <span>
          <span className="block text-[13.5px] text-text">Check for updates automatically</span>
          <span className="block text-[12.5px] text-text-2">
            Looks for a new version on GitHub when the app starts and every few hours.
          </span>
        </span>
      </label>

      <div className="mt-4 flex items-center gap-3">
        {status === "available" && info ? (
          <Button onClick={() => void install()}>Install v{info.version} and restart</Button>
        ) : (
          <Button
            variant="secondary"
            disabled={status === "checking" || status === "installing"}
            onClick={() => void check()}
          >
            {status === "checking" ? "Checking…" : "Check now"}
          </Button>
        )}
        <p role="status" className="text-[13px] text-text-2">
          {status === "upToDate" && "You have the latest version."}
          {status === "available" && info && `Version ${info.version} is available.`}
          {status === "installing" &&
            (progress === null
              ? "Downloading the update…"
              : `Downloading the update… ${Math.round(progress * 100)}%`)}
        </p>
      </div>
      {status === "error" && error && (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {error}
        </p>
      )}
      {status === "available" && info && (
        <button
          type="button"
          onClick={() => void openerService.openExternal(releaseUrl(info.version)).catch(() => {})}
          className="mt-3 text-[13px] text-accent hover:underline"
        >
          What's new in v{info.version}
        </button>
      )}
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
          <UpdatesSection />
          <AboutSection />
        </div>
      </div>
    </>
  );
}
