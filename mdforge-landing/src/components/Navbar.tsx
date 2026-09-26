import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { GitHubMark } from "@/components/GitHubMark";
import { Button } from "@/components/ui/button";
import { REPO_URL } from "@/lib/release";
import { cn } from "@/lib/utils";

const linkClass =
  "text-sm text-muted-foreground transition-colors duration-150 hover:text-text aria-[current=page]:text-text";

const LINKS = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/features", label: "Features" },
  { to: "/docs", label: "Docs" },
  { to: "/download", label: "Download" },
];

/** Sticky, transparent at the top; a glass bar with a hairline once the page scrolls. */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  // Close the phone menu whenever the page changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

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
        scrolled || menuOpen
          ? "border-line bg-sunken/90 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-5 sm:px-8"
      >
        <Link to="/" className="text-[17px] font-semibold tracking-[-0.02em] text-text">
          MDForge
        </Link>
        <ul className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <a href={REPO_URL} aria-label="MDForge on GitHub">
              <GitHubMark className="size-[18px]" />
            </a>
          </Button>
          <Button asChild>
            <Link to="/download">Download</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>
      {menuOpen && (
        <ul id="mobile-menu" className="border-t border-line px-5 py-3 md:hidden">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className="block rounded-md px-2 py-2.5 text-[15px] text-text-2 hover:bg-raised hover:text-text aria-[current=page]:text-text"
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
