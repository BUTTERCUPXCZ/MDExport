import { useEffect, useState } from "react";
import { GitHubMark } from "@/components/GitHubMark";
import { Button } from "@/components/ui/button";
import { REPO_URL } from "@/lib/release";
import { cn } from "@/lib/utils";

/** Sticky, transparent at the top; a glass bar with a hairline once the page scrolls. */
export function Navbar({ page = "home" }: { page?: "home" | "docs" }) {
  // Section links point back to the landing page when shown on the docs page.
  const home = page === "home" ? "" : "./";
  const links = [
    { href: `${home}#how-it-works`, label: "How it works" },
    { href: `${home}#features`, label: "Features" },
    { href: "./docs.html", label: "Docs", current: page === "docs" },
    { href: `${home}#download`, label: "Download" },
  ];

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
        <a href={page === "home" ? "#top" : "./"} className="text-[17px] font-semibold tracking-[-0.02em] text-text">
          MDForge
        </a>
        <ul className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                aria-current={link.current ? "page" : undefined}
                className="text-sm text-muted-foreground transition-colors duration-150 hover:text-text aria-[current=page]:text-text"
              >
                {link.label}
              </a>
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
            <a href={`${home}#download`}>Download</a>
          </Button>
        </div>
      </nav>
    </header>
  );
}
