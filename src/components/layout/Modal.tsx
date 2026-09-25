import { AlertDialog } from "radix-ui";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  /** Omit to make the modal non-dismissable (no Esc). */
  onOpenChange?: (open: boolean) => void;
  /** Small mono label above the title, e.g. "Conflict". */
  label?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer: ReactNode;
  size?: "default" | "wide";
}

/** Square modal with an ink frame; actions right-aligned below a rule. */
export function Modal({
  open,
  onOpenChange,
  label,
  title,
  description,
  children,
  footer,
  size = "default",
}: ModalProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-bg/80 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content
          onEscapeKeyDown={(e) => {
            if (!onOpenChange) e.preventDefault();
          }}
          data-size={size}
          className="fixed top-1/2 left-1/2 z-50 w-[480px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 border border-ink bg-bg data-[size=wide]:w-[620px] data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <div className="space-y-3 p-6">
            {label && <p className="label">{label}</p>}
            <AlertDialog.Title className="text-[20px] leading-tight font-semibold tracking-[-0.015em]">
              {title}
            </AlertDialog.Title>
            {description ? (
              <AlertDialog.Description className="text-[14px] leading-relaxed text-ink-2">
                {description}
              </AlertDialog.Description>
            ) : (
              <AlertDialog.Description className="sr-only">{title}</AlertDialog.Description>
            )}
            {children}
          </div>
          <div className="flex justify-end gap-2 border-t px-6 py-4">{footer}</div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
