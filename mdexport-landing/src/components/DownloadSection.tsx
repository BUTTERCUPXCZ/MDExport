import { Download } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import {
  formatSize,
  RELEASES_URL,
  REPO_URL,
  type FileKind,
  type Release,
} from "@/lib/release";
import { cn } from "@/lib/utils";

interface Platform {
  id: string;
  name: string;
  files: { kind: FileKind; label: string; hint: string }[];
  note: string;
}

const PLATFORMS: Platform[] = [
  {
    id: "windows",
    name: "Windows",
    files: [
      { kind: "exe", label: "Installer", hint: ".exe · Windows 10 and 11" },
      { kind: "msi", label: "MSI package", hint: ".msi · for managed installs" },
    ],
    note: "SmartScreen may warn: More info → Run anyway.",
  },
  {
    id: "mac",
    name: "macOS",
    files: [
      { kind: "dmgArm", label: "Apple Silicon", hint: ".dmg · M1 and newer" },
      { kind: "dmgIntel", label: "Intel", hint: ".dmg · Intel Macs" },
    ],
    note: "First launch: right-click the app → Open.",
  },
  {
    id: "linux",
    name: "Linux",
    files: [
      { kind: "deb", label: "Debian / Ubuntu", hint: ".deb" },
      { kind: "appImage", label: "AppImage", hint: ".AppImage · any distro" },
      { kind: "rpm", label: "Fedora / openSUSE", hint: ".rpm" },
    ],
    note: "AppImage: chmod +x, then run it.",
  },
];

const BUILD = `git clone ${REPO_URL}.git
cd MDExport && pnpm install
pnpm tauri build`;

export function DownloadSection({ release }: { release: Release }) {
  return (
    <section id="download" className="scroll-mt-20 border-t border-line py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="max-w-[640px]">
          <h2 className="text-[clamp(32px,4.4vw,46px)] leading-[1.05] font-semibold tracking-[-0.03em] text-text">
            Download MDExport
          </h2>
          <p className="mt-4 text-[17px] leading-relaxed text-text-2">
            {release.version ?? "Latest release"} for Windows, macOS and Linux. Free, open source,
            and it works offline.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
          {PLATFORMS.map((platform) => {
            return (
              <div
                key={platform.id}
                className="flex flex-col rounded-[20px] border border-line bg-panel p-6"
              >
                <h3 className="text-xl font-semibold tracking-[-0.015em] text-text">
                  {platform.name}
                </h3>

                <ul className="mt-5 flex flex-col gap-2">
                  {platform.files.map((file, index) => {
                    const asset = release.files[file.kind];
                    const primary = index === 0;
                    return (
                      <li key={file.kind}>
                        <a
                          href={asset?.url ?? RELEASES_URL}
                          className={cn(
                            "group flex items-center gap-3 rounded-[10px] border px-4 py-3 transition-colors duration-150",
                            primary
                              ? "border-transparent bg-accent text-accent-ink hover:bg-accent-hover"
                              : "border-line bg-canvas text-text hover:border-line-strong hover:bg-raised",
                          )}
                        >
                          <Download
                            aria-hidden
                            className={cn(
                              "size-4 shrink-0",
                              primary ? "text-accent-ink" : "text-muted-foreground",
                            )}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[15px] font-medium">{file.label}</span>
                            <span
                              className={cn(
                                "block text-[13px]",
                                primary ? "text-accent-ink/75" : "text-muted-foreground",
                              )}
                            >
                              {file.hint}
                              {asset && ` · ${formatSize(asset.size)}`}
                            </span>
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-auto pt-5 text-[13px] leading-relaxed text-muted-foreground">
                  {platform.note}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-12 lg:gap-6">
          <div className="relative min-w-0 rounded-[20px] border border-line bg-canvas md:col-span-7">
            <pre className="overflow-x-auto px-6 py-5 font-mono text-[13px] leading-[1.9] text-text-2">
              <span className="text-muted-foreground"># or build it yourself (Rust, Node 20+, pnpm)</span>
              {"\n"}
              {BUILD}
            </pre>
            <CopyButton text={BUILD} label="Copy commands" />
          </div>
          <p className="self-center text-[15px] leading-relaxed text-text-2 md:col-span-5">
            The builds aren't code-signed yet, so your OS asks once before the first launch.
            Every installer is built from the public source by{" "}
            <a
              href={`${REPO_URL}/actions`}
              className="text-text underline decoration-line-strong underline-offset-4 hover:decoration-accent"
            >
              GitHub Actions
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
