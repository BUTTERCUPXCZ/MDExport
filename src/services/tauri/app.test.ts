import { clearMocks, mockIPC } from "@tauri-apps/api/mocks";
import { afterEach, describe, expect, it } from "vitest";
import { appService } from "@/services/tauri/app";

describe("appService", () => {
  afterEach(() => {
    clearMocks();
  });

  it("getInfo calls the get_app_info command", async () => {
    const calls: string[] = [];
    mockIPC((cmd) => {
      calls.push(cmd);
      if (cmd === "get_app_info") return { name: "MDForge", version: "0.1.0" };
    });

    await expect(appService.getInfo()).resolves.toEqual({ name: "MDForge", version: "0.1.0" });
    expect(calls).toEqual(["get_app_info"]);
  });
});
