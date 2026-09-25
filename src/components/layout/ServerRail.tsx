import { Link, type LinkProps } from "@tanstack/react-router";
import { LibraryBig, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ComingSoon } from "@/components/layout/ComingSoon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const railIcon =
  "relative flex size-12 items-center justify-center rounded-3xl transition-all duration-150 hover:rounded-2xl";

/** White pill on the rail's left edge: small on hover, tall when active. */
function Pill() {
  return (
    <span
      aria-hidden
      className="absolute top-1/2 -left-3 h-0 w-1 -translate-y-1/2 rounded-r-full bg-header-primary transition-all duration-150 group-hover:h-5 group-data-[status=active]:h-10"
    />
  );
}

interface RailLinkProps {
  to: LinkProps["to"];
  label: string;
  exact?: boolean;
  children: ReactNode;
  className?: string;
}

function RailLink({ to, label, exact, children, className }: RailLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={to}
          aria-label={label}
          activeOptions={{ exact }}
          className={cn(
            railIcon,
            "group bg-surface-primary text-text-normal hover:bg-primary hover:text-white data-[status=active]:rounded-2xl data-[status=active]:bg-primary data-[status=active]:text-white",
            className,
          )}
        >
          <Pill />
          {children}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Far-left navigation rail (Discord's server list). */
export function ServerRail() {
  return (
    <nav
      aria-label="Workspaces"
      className="flex w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-surface-tertiary py-3"
    >
      <RailLink to="/" label="Home" exact>
        <span className="text-sm font-extrabold tracking-tight">MD</span>
      </RailLink>

      <div className="h-0.5 w-8 rounded-full bg-surface-selected" role="separator" />

      <RailLink to="/library" label="Library">
        <LibraryBig className="size-6" />
      </RailLink>

      <ComingSoon label="Create project — coming soon" side="right">
        <button
          type="button"
          disabled
          aria-label="Create project"
          className={cn(railIcon, "bg-surface-primary text-success opacity-60")}
        >
          <Plus className="size-6" />
        </button>
      </ComingSoon>
    </nav>
  );
}
