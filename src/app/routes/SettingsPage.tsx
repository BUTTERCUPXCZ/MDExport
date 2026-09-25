import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/** Planned settings from Phase 18 of the implementation plan. */
const SECTIONS = [
  {
    id: "appearance",
    label: "Appearance",
    items: [
      ["Theme", "Dark, light, or follow the system."],
      ["Editor Font", "Font used in the Markdown editor."],
      ["Font Size", "Editor and preview text size."],
      ["Preview Width", "Maximum width of the rendered preview."],
    ],
  },
  {
    id: "editor",
    label: "Editor",
    items: [
      ["Word Wrap", "Wrap long lines in the editor."],
      ["Auto Save", "Save automatically after you stop typing."],
      ["Sync Scrolling", "Keep editor and preview scrolled together."],
    ],
  },
  {
    id: "export",
    label: "Export",
    items: [
      ["Default PDF Template", "Template used for PDF exports."],
      ["Default DOCX Template", "Template used for Word exports."],
      ["Default Output Folder", "Where exported files are saved."],
    ],
  },
  {
    id: "library",
    label: "Library",
    items: [
      ["Library Location", "Folder where new documents are created."],
      ["Version Retention", "How many old versions to keep."],
      ["Backup", "Export or restore your whole library."],
    ],
  },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/** Full-screen settings layer (Discord's User Settings layout). Esc closes it. */
export function SettingsPage() {
  const [sectionId, setSectionId] = useState<SectionId>("appearance");
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
          <ul>
            {section.items.map(([name, description]) => (
              <li
                key={name}
                className="flex items-center justify-between gap-4 border-b border-border py-4"
              >
                <div>
                  <div className="text-base font-medium text-header-primary">{name}</div>
                  <div className="text-sm text-text-muted">{description}</div>
                </div>
                <span className="shrink-0 rounded-sm bg-surface-tertiary px-2 py-0.5 text-xs font-semibold text-text-muted uppercase">
                  Coming soon
                </span>
              </li>
            ))}
          </ul>
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
