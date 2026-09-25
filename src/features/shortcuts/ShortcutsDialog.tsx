import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { SHORTCUT_GROUPS } from "@/features/shortcuts/shortcuts";
import { useUiStore } from "@/features/ui/uiStore";

/** Discord-style keycap. */
export function Keycap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-[4px] bg-surface-tertiary px-1.5 font-sans text-xs font-semibold text-interactive-hover shadow-[inset_0_-2px_0_rgb(0_0_0/0.35)]">
      {children}
    </kbd>
  );
}

export function ShortcutList() {
  return (
    <div className="space-y-6">
      {SHORTCUT_GROUPS.map((group) => (
        <section key={group.title}>
          <h3 className="mb-2 text-xs font-bold tracking-wide text-header-secondary uppercase">
            {group.title}
          </h3>
          <ul>
            {group.items.map(([label, keys]) => (
              <li
                key={label}
                className="flex items-center justify-between gap-4 border-b border-border py-2 last:border-b-0"
              >
                <span className="text-sm text-text-normal">{label}</span>
                <span className="flex items-center gap-1">
                  {keys.map((key) => (
                    <Keycap key={key}>{key}</Keycap>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Ctrl+/ keyboard shortcuts sheet. */
export function ShortcutsDialog() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const setOpen = useUiStore((s) => s.setShortcutsOpen);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[80vh] w-[560px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-surface-primary shadow-elevation-high data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between p-4 pb-2">
            <Dialog.Title className="text-xl font-bold text-header-primary">
              Keyboard shortcuts
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close"
              className="flex size-8 items-center justify-center rounded-md text-interactive-normal hover:bg-surface-hover hover:text-interactive-hover"
            >
              <X className="size-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="px-4 text-sm text-text-muted">
            Ctrl is Cmd on macOS.
          </Dialog.Description>
          <div className="overflow-y-auto p-4">
            <ShortcutList />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
