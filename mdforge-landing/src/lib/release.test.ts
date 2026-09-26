import { describe, expect, it } from "vitest";
import { formatSize, pickAssets } from "@/lib/release";

const asset = (name: string) => ({
  name,
  browser_download_url: `https://example.test/${name}`,
  size: 27_153_846,
});

describe("pickAssets", () => {
  it("maps tauri-action file names to installer kinds", () => {
    const files = pickAssets([
      asset("MDForge_0.1.0_x64-setup.exe"),
      asset("MDForge_0.1.0_x64_en-US.msi"),
      asset("MDForge_0.1.0_aarch64.dmg"),
      asset("MDForge_0.1.0_x64.dmg"),
      asset("MDForge_0.1.0_amd64.deb"),
      asset("MDForge_0.1.0_amd64.AppImage"),
      asset("MDForge-0.1.0-1.x86_64.rpm"),
      asset("MDForge_aarch64.app.tar.gz"),
    ]);

    expect(files.exe?.name).toBe("MDForge_0.1.0_x64-setup.exe");
    expect(files.msi?.name).toBe("MDForge_0.1.0_x64_en-US.msi");
    expect(files.dmgArm?.name).toBe("MDForge_0.1.0_aarch64.dmg");
    expect(files.dmgIntel?.name).toBe("MDForge_0.1.0_x64.dmg");
    expect(files.deb?.url).toBe("https://example.test/MDForge_0.1.0_amd64.deb");
    expect(files.appImage?.name).toBe("MDForge_0.1.0_amd64.AppImage");
    expect(files.rpm?.name).toBe("MDForge-0.1.0-1.x86_64.rpm");
  });

  it("leaves missing kinds out", () => {
    expect(pickAssets([asset("notes.txt")])).toEqual({});
  });
});

describe("formatSize", () => {
  it("rounds to whole megabytes", () => {
    expect(formatSize(27_153_846)).toBe("26 MB");
    expect(formatSize(1000)).toBe("1 MB");
  });
});
