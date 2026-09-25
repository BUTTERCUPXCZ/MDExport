import type { ReactElement, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ComingSoonProps {
  /** A disabled control. Wrapped so the tooltip still shows on hover/focus. */
  children: ReactElement;
  label?: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

/** Placeholder for controls whose feature lands in a later phase. */
export function ComingSoon({
  children,
  label = "Coming soon",
  side = "bottom",
  className,
}: ComingSoonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className={cn("inline-flex rounded-md", className)}>
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
