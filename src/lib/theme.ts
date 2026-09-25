const LIGHT_QUERY = "(prefers-color-scheme: light)";

/**
 * Applies the `dark` class to <html> based on the OS color scheme.
 * Dark is the default: light is used only when the OS explicitly prefers it.
 * Returns a cleanup function that stops following OS changes.
 */
export function followSystemTheme(root: HTMLElement = document.documentElement): () => void {
  const media = window.matchMedia(LIGHT_QUERY);
  const apply = () => root.classList.toggle("dark", !media.matches);

  apply();
  media.addEventListener("change", apply);
  return () => media.removeEventListener("change", apply);
}
