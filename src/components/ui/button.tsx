import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

/** Square, typographic buttons. Labels are set in mono uppercase (terminal feel). */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 border font-mono text-[12px] font-medium tracking-[0.06em] whitespace-nowrap uppercase transition-colors outline-none select-none disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        /** Ink block. The one primary action on a screen. */
        primary: "border-ink bg-ink text-bg hover:border-accent hover:bg-accent hover:text-white",
        /** Outlined. */
        secondary: "border-ink/80 bg-transparent text-ink hover:bg-ink hover:text-bg",
        /** Text only. */
        ghost: "border-transparent bg-transparent text-ink-2 hover:text-ink",
        danger: "border-danger bg-danger text-white hover:bg-transparent hover:text-danger",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 px-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
