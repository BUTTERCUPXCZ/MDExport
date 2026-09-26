import { describe, expect, it } from "vitest";
import { sameListing } from "@/features/library/libraryStore";
import type { LibraryListing } from "@/types/library";

const listing = (modifiedMs = 1): LibraryListing => ({
  root: "/lib",
  folders: ["notes"],
  documents: [{ path: "/lib/a.md", relativePath: "a.md", name: "a.md", modifiedMs }],
  truncated: false,
});

describe("sameListing", () => {
  it("matches identical scans", () => {
    expect(sameListing(listing(), listing())).toBe(true);
  });

  it("notices edits, new folders and a first scan", () => {
    expect(sameListing(listing(1), listing(2))).toBe(false);
    expect(sameListing(listing(), { ...listing(), folders: ["notes", "x"] })).toBe(false);
    expect(sameListing(null, listing())).toBe(false);
  });
});
