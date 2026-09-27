import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router";
import { GitHubMark } from "@/components/GitHubMark";
import { Button } from "@/components/ui/button";
import { REPO_URL } from "@/lib/release";
import { cn } from "@/lib/utils";

const linkClass =
  "text-sm text-muted-foreground transition-colors duration-150 hover:text-text aria-[current=page]:text-text";

/** Sticky, transparent at the top; a glass bar with a hairline once the page scrolls. */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-200",
        scrolled
          ? "border-line bg-sunken/75 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-5 sm:px-8"
      >
        <Link to="/" className="text-[17px] font-semibold tracking-[-0.02em] text-text">
          MDExport
        </Link>
        <ul className="hidden items-center gap-7 md:flex">
          <li>
            <Link to="/#how-it-works" className={linkClass}>
              How it works
            </Link>
          </li>
          <li>
            <Link to="/#features" className={linkClass}>
              Features
            </Link>
          </li>
          <li>
            <NavLink to="/docs" className={linkClass}>
              Docs
            </NavLink>
          </li>
          <li>
            <Link to="/#download" className={linkClass}>
              Download
            </Link>
          </li>
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <a href={REPO_URL} aria-label="MDExport on GitHub">
              <GitHubMark className="size-[18px]" />
            </a>
          </Button>
          <Button asChild>
            <Link to="/#download">Download</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
