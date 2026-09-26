import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { SHORTCUT_GROUPS } from "@/features/shortcuts/shortcuts";
import { useUiStore } from "@/features/ui/uiStore";

export function Keycap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-sm border border-line-strong bg-canvas px-1.5 font-sans text-[11.5px] font-medium text-text-2">
      {children}
    </kbd>
  );
}

export function ShortcutList() {
  return (
    <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      {SHORTCUT_GROUPS.map((group) => (
        <section key={group.title}>
          <h3 className="mb-1 text-[12.5px] font-medium text-muted">{group.title}</h3>
          <ul>
            {group.items.map(([label, keys]) => (
              <li key={label} className="flex h-8 items-center justify-between gap-4">
                <span className="truncate text-[13px] text-text">{label}</span>
                <span className="flex shrink-0 items-center gap-1">
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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[80vh] w-[720px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-line bg-raised shadow-float data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <div className="flex items-start justify-between border-b border-line px-6 pt-5 pb-4">
            <div>
              <Dialog.Title className="text-[17px] font-semibold text-text">
                Keyboard shortcuts
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-[13px] text-text-2">
                Ctrl is Cmd on macOS.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-accent-soft hover:text-text"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto px-6 py-5">
            <ShortcutList />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
