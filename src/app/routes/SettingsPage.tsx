import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { refreshLibrary } from "@/features/library/libraryStore";
import { useLibraryLocation } from "@/features/library/useLibraryLocation";
import { showError } from "@/features/notices/noticeStore";
import { ShortcutList } from "@/features/shortcuts/ShortcutsDialog";
import { appService } from "@/services/tauri/app";
import { libraryService } from "@/services/tauri/library";
import { toAppError } from "@/types/document";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-border pb-5">
      <h2 className="mb-2 text-xs font-bold tracking-wide text-header-secondary uppercase">
        {label}
      </h2>
      {children}
    </div>
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
    <Field label="Library folder">
      <p className="mb-3 text-sm text-text-muted">
        New documents are created here. Top-level folders appear as icons in the left rail.
      </p>
      <div className="flex items-center gap-3">
        <code className="min-w-0 flex-1 rounded-[3px] bg-surface-tertiary px-2.5 py-2 font-mono text-sm break-all text-text-normal">
          {location || "Not set"}
        </code>
        <Button variant="secondary" onClick={() => void change()}>
          Change…
        </Button>
      </div>
    </Field>
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
    <Field label="MDForge">
      <p className="text-sm text-text-normal">Version {version ?? "unknown"}</p>
      <p className="mt-1 text-sm text-text-muted">
        Local-first Markdown workspace. Your documents are plain .md files on your disk.
      </p>
    </Field>
  );
}

const SECTIONS = [
  { id: "library", label: "Library", render: () => <LibrarySection /> },
  { id: "keybinds", label: "Keybinds", render: () => <ShortcutList /> },
  { id: "about", label: "About", render: () => <AboutSection /> },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/** Full-screen settings layer (Discord's User Settings layout). Esc closes it. */
export function SettingsPage() {
  const [sectionId, setSectionId] = useState<SectionId>("library");
  const section = SECTIONS.find((s) => s.id === sectionId) ?? SECTIONS[0];

  const router = useRouter();
  const navigate = useNavigate();
  const canGoBack = useCanGoBack();

  const close = useCallback(() => {
    if (canGoBack) router.history.back();
    else void navigate({ to: "/" });
  }, [canGoBack, navigate, router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  return (
    <div className="flex h-screen">
      <aside className="flex flex-[1_0_218px] justify-end overflow-y-auto bg-surface-secondary">
        <nav aria-label="Settings" className="w-[218px] py-[60px] pr-1.5 pl-5">
          <h2 className="px-2.5 pb-1.5 text-xs font-bold tracking-wide text-channel-default uppercase">
            App Settings
          </h2>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-current={s.id === sectionId ? "page" : undefined}
              onClick={() => setSectionId(s.id)}
              className="mb-0.5 block w-full rounded-md px-2.5 py-1.5 text-left text-base font-medium text-interactive-normal hover:bg-surface-hover hover:text-interactive-hover aria-[current=page]:bg-surface-selected aria-[current=page]:text-interactive-active"
            >
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex flex-[1_1_800px] items-start overflow-y-auto bg-surface-primary">
        <section className="max-w-[740px] min-w-[460px] flex-1 px-10 pt-[60px] pb-20">
          <h1 className="mb-5 text-xl font-semibold text-header-primary">{section.label}</h1>
          {section.render()}
        </section>

        <div className="sticky top-0 flex-none pt-[60px] pr-5">
          <button
            type="button"
            onClick={close}
            aria-label="Close settings"
            className="group flex flex-col items-center gap-2"
          >
            <span className="flex size-9 items-center justify-center rounded-full border-2 border-interactive-normal text-interactive-normal transition-colors group-hover:bg-surface-hover">
              <X className="size-[18px]" />
            </span>
            <span className="text-[13px] font-semibold text-interactive-normal">ESC</span>
          </button>
        </div>
      </div>
    </div>
  );
}
