import { useEffect, useState } from "react";

export const REPO_URL = "https://github.com/BUTTERCUPXCZ/MDforge";
export const RELEASES_URL = `${REPO_URL}/releases/latest`;
const LATEST_API = "https://api.github.com/repos/BUTTERCUPXCZ/MDforge/releases/latest";

export type OS = "windows" | "mac" | "linux" | "unknown";

/** Best guess of the visitor's desktop OS (phones count as unknown). */
export function detectOS(userAgent: string, platform = ""): OS {
  const text = `${platform} ${userAgent}`.toLowerCase();
  if (/android|iphone|ipad|ipod/.test(text)) return "unknown";
  if (text.includes("win")) return "windows";
  if (text.includes("mac")) return "mac";
  if (text.includes("linux") || text.includes("x11")) return "linux";
  return "unknown";
}

export interface Asset {
  name: string;
  url: string;
  size: number;
}

export type FileKind = "exe" | "msi" | "dmgArm" | "dmgIntel" | "deb" | "appImage" | "rpm";

/** Installer file names as tauri-action names them, e.g. MDForge_0.1.0_x64-setup.exe. */
const PATTERNS: Record<FileKind, RegExp> = {
  exe: /_x64-setup\.exe$/i,
  msi: /\.msi$/i,
  dmgArm: /_aarch64\.dmg$/i,
  dmgIntel: /_x64\.dmg$/i,
  deb: /_amd64\.deb$/i,
  appImage: /\.AppImage$/,
  rpm: /\.rpm$/i,
};

interface ApiAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

/** Picks one asset per installer kind from a GitHub release. */
export function pickAssets(assets: ApiAsset[]): Partial<Record<FileKind, Asset>> {
  const out: Partial<Record<FileKind, Asset>> = {};
  for (const kind of Object.keys(PATTERNS) as FileKind[]) {
    const match = assets.find((a) => PATTERNS[kind].test(a.name));
    if (match) out[kind] = { name: match.name, url: match.browser_download_url, size: match.size };
  }
  return out;
}

export function formatSize(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1_048_576))} MB`;
}

export interface Release {
  /** "v0.1.0", or null until known. */
  version: string | null;
  files: Partial<Record<FileKind, Asset>>;
}

/**
 * The latest published release. Until it loads, or if GitHub can't be reached,
 * `files` is empty and download links fall back to the Releases page.
 */
export function useLatestRelease(): Release {
  const [release, setRelease] = useState<Release>({ version: null, files: {} });

  useEffect(() => {
    const controller = new AbortController();
    fetch(LATEST_API, { signal: controller.signal, headers: { Accept: "application/vnd.github+json" } })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { tag_name?: string; assets?: ApiAsset[] }) =>
        setRelease({ version: data.tag_name ?? null, files: pickAssets(data.assets ?? []) }),
      )
      .catch(() => {
        /* keep the fallback links */
      });
    return () => controller.abort();
  }, []);

  return release;
}

/** Visitor's OS, read once on the client. */
export function useOS(): OS {
  const [os] = useState<OS>(() =>
    typeof navigator === "undefined"
      ? "unknown"
      : detectOS(
          navigator.userAgent,
          (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
            ?.platform ?? navigator.platform,
        ),
  );
  return os;
}
