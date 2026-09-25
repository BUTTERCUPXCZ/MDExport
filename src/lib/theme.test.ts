import { afterEach, describe, expect, it, vi } from "vitest";
import { followSystemTheme } from "@/lib/theme";

function mockColorScheme(prefersLight: boolean) {
  const listeners = new Set<() => void>();
  const media = {
    matches: prefersLight,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  vi.stubGlobal("matchMedia", () => media);
  return {
    change(nextPrefersLight: boolean) {
      media.matches = nextPrefersLight;
      listeners.forEach((fn) => fn());
    },
  };
}

describe("followSystemTheme", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses dark unless the OS prefers light", () => {
    const root = document.createElement("html");
    mockColorScheme(false);

    followSystemTheme(root);

    expect(root).toHaveClass("dark");
  });

  it("follows OS changes until cleaned up", () => {
    const root = document.createElement("html");
    const os = mockColorScheme(true);

    const stop = followSystemTheme(root);
    expect(root).not.toHaveClass("dark");

    os.change(false);
    expect(root).toHaveClass("dark");

    stop();
    os.change(true);
    expect(root).toHaveClass("dark");
  });
});
