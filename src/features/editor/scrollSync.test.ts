import { describe, expect, it } from "vitest";
import { monotonic, previewScrollFor, type Anchor } from "@/features/editor/scrollSync";

const anchors: Anchor[] = [
  { line: 1, top: 16 },
  { line: 3, top: 116 },
  { line: 11, top: 516 },
];

describe("scroll sync", () => {
  it("lands on the block that starts at the top line", () => {
    expect(previewScrollFor(3, anchors, 2000)).toBe(100);
  });

  it("interpolates inside long blocks", () => {
    expect(previewScrollFor(7, anchors, 2000)).toBe(300);
  });

  it("stays at the top before the first block and clamps to the end", () => {
    expect(previewScrollFor(1, anchors, 2000)).toBe(0);
    expect(previewScrollFor(40, anchors, 400)).toBe(400);
    expect(previewScrollFor(Infinity, anchors, 1234)).toBe(1234);
    expect(previewScrollFor(5, [], 1000)).toBe(0);
  });

  it("keeps one anchor per line, never moving backwards", () => {
    expect(
      monotonic([
        { line: 5, top: 300 },
        { line: 2, top: 100 },
        { line: 2, top: 120 },
        { line: 6, top: 250 },
      ]),
    ).toEqual([
      { line: 2, top: 100 },
      { line: 5, top: 300 },
    ]);
  });
});
