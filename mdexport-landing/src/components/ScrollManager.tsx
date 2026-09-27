import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Router links don't scroll by themselves: go to the #section in the URL
 * (e.g. /#features from the docs), or to the top when the page changes.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Wait a tick so the target page has rendered.
      const timer = window.setTimeout(() => {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
      }, 0);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
