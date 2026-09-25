import { describe, expect, it } from "vitest";
import { documentTitle, wordCount } from "@/features/editor/documentText";

describe("documentTitle", () => {
  it("uses the first heading", () => {
    expect(documentTitle("intro\n\n## Bug: Login fails ##\n\n# Later")).toBe("Bug: Login fails");
  });

  it("returns null without a heading", () => {
    expect(documentTitle("no heading here\n#not-a-heading")).toBeNull();
  });
});

describe("wordCount", () => {
  it("counts words, ignoring Markdown punctuation", () => {
    expect(wordCount("# Bug Fix\n\n- **don't** panic, it's `v2`")).toBe(6);
  });

  it("is zero for blank text", () => {
    expect(wordCount("  \n ")).toBe(0);
  });
});
