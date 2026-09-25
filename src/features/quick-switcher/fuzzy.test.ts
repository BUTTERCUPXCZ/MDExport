import { describe, expect, it } from "vitest";
import { fuzzyScore } from "@/features/quick-switcher/fuzzy";

describe("fuzzyScore", () => {
  it("matches subsequences case-insensitively", () => {
    expect(fuzzyScore("afl", "auth-flow.md")).not.toBeNull();
    expect(fuzzyScore("AUTH", "auth-flow.md")).not.toBeNull();
    expect(fuzzyScore("xyz", "auth-flow.md")).toBeNull();
  });

  it("empty query matches everything with score 0", () => {
    expect(fuzzyScore("  ", "anything")).toBe(0);
  });

  it("ranks prefix and word-start matches above scattered ones", () => {
    const prefix = fuzzyScore("pay", "payments.md")!;
    const wordStart = fuzzyScore("pay", "backend/payments.md")!;
    const scattered = fuzzyScore("pay", "prepare-array.md")!;
    expect(prefix).toBeGreaterThan(scattered);
    expect(wordStart).toBeGreaterThan(scattered);
  });

  it("ignores spaces in the query", () => {
    expect(fuzzyScore("auth flow", "auth-flow.md")).not.toBeNull();
  });
});
