import { Link } from "react-router";
import { REPO_URL } from "@/lib/release";

const LINKS = [
  { href: REPO_URL, label: "GitHub" },
  { href: `${REPO_URL}/releases`, label: "Releases" },
  { href: `${REPO_URL}/issues`, label: "Report an issue" },
];

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:px-8">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-text">MDExport</span> · Built with Tauri, Rust and
          React.
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 sm:ml-auto">
          <li>
            <Link
              to="/docs"
              className="text-sm text-muted-foreground transition-colors duration-150 hover:text-text"
            >
              Docs
            </Link>
          </li>
          {LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-sm text-muted-foreground transition-colors duration-150 hover:text-text"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
