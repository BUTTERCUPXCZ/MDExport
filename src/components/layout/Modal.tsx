import { AlertDialog } from "radix-ui";
import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  /** Omit to make the modal non-dismissable (no Esc / outside click). */
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer: ReactNode;
  size?: "default" | "wide";
}

/**
 * Discord-style modal: title top-left, content, grey footer with right-aligned actions.
 * Built on Radix AlertDialog, so focus is trapped and a decision is required.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "default",
}: ModalProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content
          onEscapeKeyDown={(e) => {
            if (!onOpenChange) e.preventDefault();
          }}
          data-size={size}
          className="fixed top-1/2 left-1/2 z-50 w-[440px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg bg-surface-primary shadow-elevation-high data-[size=wide]:w-[600px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="space-y-2 p-4">
            <AlertDialog.Title className="text-xl font-bold text-header-primary">
              {title}
            </AlertDialog.Title>
            {description ? (
              <AlertDialog.Description className="text-base text-text-normal">
                {description}
              </AlertDialog.Description>
            ) : (
              <AlertDialog.Description className="sr-only">{title}</AlertDialog.Description>
            )}
            {children}
          </div>
          <div className="flex justify-end gap-2 bg-surface-secondary p-4">{footer}</div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/** Discord's text-style "Cancel" button used in modal footers. */
export function ModalCancel({
  onClick,
  children = "Cancel",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-[38px] px-4 text-sm font-medium text-header-primary hover:underline"
    >
      {children}
    </button>
  );
}
