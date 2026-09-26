import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

/** Sections that used to live on the home page and now have their own route. */
const MOVED: Record<string, string> = {
  "#how-it-works": "/how-it-works",
  "#features": "/features",
  "#download": "/download",
};

/**
 * Router links don't scroll by themselves: go to the #section in the URL, or to
 * the top when the page changes. Old links like /#download forward to /download.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (pathname === "/" && MOVED[hash]) {
      void navigate(MOVED[hash], { replace: true });
      return;
    }
    if (hash) {
      // Wait a tick so the target page has rendered.
      const timer = window.setTimeout(() => {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
      }, 0);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash, navigate]);

  return null;
}
