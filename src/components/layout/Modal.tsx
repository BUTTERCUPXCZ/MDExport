import { AlertDialog } from "radix-ui";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ModalProps {
  open: boolean;
  /** Omit to make the modal non-dismissable (no Esc). */
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer: ReactNode;
  size?: "default" | "wide";
}

/**
 * Confirmation / decision dialog. Reserved for moments that really need a
 * decision (conflicts, destructive actions, first-run setup).
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
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <AlertDialog.Content
          onEscapeKeyDown={(e) => {
            if (!onOpenChange) e.preventDefault();
          }}
          data-size={size}
          className="fixed top-[18%] left-1/2 z-50 w-[460px] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-xl border border-line bg-raised shadow-float data-[size=wide]:w-[600px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2"
        >
          <div className="px-6 pt-5 pb-4">
            <AlertDialog.Title className="text-[17px] font-semibold tracking-[-0.01em] text-text">
              {title}
            </AlertDialog.Title>
            {description ? (
              <AlertDialog.Description className="mt-1.5 text-[13.5px] leading-relaxed text-text-2">
                {description}
              </AlertDialog.Description>
            ) : (
              <AlertDialog.Description className="sr-only">{title}</AlertDialog.Description>
            )}
            {children}
          </div>
          <div className="flex justify-end gap-2 border-t border-line px-6 py-3.5">{footer}</div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

/** Quiet "Cancel" for modal footers. */
export function ModalCancel({
  onClick,
  children = "Cancel",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <Button variant="ghost" onClick={onClick}>
      {children}
    </Button>
  );
}
