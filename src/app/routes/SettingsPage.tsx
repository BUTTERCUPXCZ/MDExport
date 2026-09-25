import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { HeaderAction } from "@/components/layout/HeaderAction";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useLibraryLocation } from "@/features/library/useLibraryLocation";
import { showError } from "@/features/notices/noticeStore";
import { libraryService } from "@/services/tauri/library";
import { toAppError } from "@/types/document";

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

function LibraryLocationSetting() {
  const location = useLibraryLocation((s) => s.location);
  const setLocation = useLibraryLocation((s) => s.set);

  const change = async () => {
    try {
      const chosen = await libraryService.chooseLocation();
      if (chosen) setLocation(chosen);
    } catch (e) {
      showError(`Couldn't change the library folder: ${toAppError(e).message}`);
    }
  };

  return (
    <>
      <p className="mt-2 font-mono text-[12px] break-all text-ink">{location || "Not set"}</p>
      <Button variant="secondary" size="sm" className="mt-3" onClick={() => void change()}>
        Change…
      </Button>
    </>
  );
}

/** Settings page. Esc returns to the previous page. */
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
    <>
      <PageHeader
        title="Settings"
        actions={
          <HeaderAction onClick={close} shortcut="Esc">
            Close
          </HeaderAction>
        }
      />
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Settings" className="w-52 shrink-0 border-r py-6">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-current={s.id === sectionId ? "page" : undefined}
              onClick={() => setSectionId(s.id)}
              className="group flex h-8 w-full items-center gap-3 border-l-2 border-transparent pl-[22px] text-left text-[13px] text-ink-2 hover:text-ink aria-[current=page]:border-accent aria-[current=page]:text-ink"
            >
              <span
                aria-hidden
                className="w-5 font-mono text-[11px] text-ink-3 group-aria-[current=page]:text-accent"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.label}
            </button>
          ))}
        </nav>

        <section className="min-w-0 flex-1 overflow-y-auto px-6 py-6 md:px-12">
          <h2 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">
            {section.label}
          </h2>
          <ul className="mt-6 max-w-2xl border-t border-ink">
            {section.items.map(([name, description]) => (
              <li key={name} className="grid grid-cols-[1fr_auto] gap-6 border-b py-4">
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold">{name}</h3>
                  <p className="mt-0.5 text-[13px] text-ink-2">{description}</p>
                  {name === "Library Location" && <LibraryLocationSetting />}
                </div>
                {name !== "Library Location" && <span className="pt-0.5 label">Soon</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
