import { describe, expect, it } from "vitest";
import {
  folderOf,
  libraryOrder,
  libraryTree,
  recentDocuments,
  relativeTime,
  shortAge,
  stem,
} from "@/features/library/libraryModel";
import type { LibraryEntry, LibraryListing } from "@/types/library";

const doc = (relativePath: string, modifiedMs = 0): LibraryEntry => ({
  path: `/lib/${relativePath}`,
  relativePath,
  name: relativePath.split("/").pop()!,
  modifiedMs,
});

const listing: LibraryListing = {
  root: "/lib",
  folders: ["backend", "backend/bugs", "backend/handovers", "backend/empty", "frontend"],
  documents: [
    doc("Readme.md", 5),
    doc("backend/api.md", 30),
    doc("backend/handovers/auth-flow.md", 20),
    doc("backend/handovers/Payments.md", 10),
    doc("backend/bugs/login-500.md", 40),
    doc("frontend/ui.md", 1),
  ],
  truncated: false,
};

describe("libraryModel", () => {
  it("splits relative paths", () => {
    expect(folderOf("a/b/c.md")).toBe("a/b");
    expect(folderOf("c.md")).toBe("");
  });

  it("builds the whole library as a sorted tree with totals, keeping empty folders", () => {
    const root = libraryTree(listing);

    expect(root.documents.map((d) => d.name)).toEqual(["Readme.md"]);
    expect(root.folders.map((f) => f.name)).toEqual(["backend", "frontend"]);
    expect(root.total).toBe(6);

    const backend = root.folders[0]!;
    expect(backend.documents.map((d) => d.name)).toEqual(["api.md"]);
    expect(backend.folders.map((f) => [f.name, f.total])).toEqual([
      ["bugs", 1],
      ["empty", 0],
      ["handovers", 2],
    ]);
    expect(backend.folders[2]!.documents.map((d) => d.name)).toEqual([
      "auth-flow.md",
      "Payments.md",
    ]);
    expect(backend.total).toBe(4);
  });

  it("creates parent folders that the listing did not name", () => {
    const root = libraryTree({ ...listing, folders: [], documents: [doc("a/b/c.md")] });
    expect(root.folders[0]!.folders[0]!.path).toBe("a/b");
  });

  it("gives index order for keyboard navigation", () => {
    expect(libraryOrder(listing).map((d) => d.name)).toEqual([
      "Readme.md",
      "api.md",
      "login-500.md",
      "auth-flow.md",
      "Payments.md",
      "ui.md",
    ]);
  });

  it("sorts recent documents newest first", () => {
    expect(recentDocuments(listing.documents, 2).map((d) => d.name)).toEqual([
      "login-500.md",
      "api.md",
    ]);
  });

  it("formats names and ages", () => {
    const now = 1_000_000_000_000;
    expect(stem("auth-flow.md")).toBe("auth-flow");
    expect(stem("notes.markdown")).toBe("notes");
    expect(shortAge(now - 20_000, now)).toBe("now");
    expect(shortAge(now - 5 * 60_000, now)).toBe("5m");
    expect(shortAge(now - 3 * 3_600_000, now)).toBe("3h");
    expect(shortAge(now - 2 * 86_400_000, now)).toBe("2d");
    expect(relativeTime(now - 10_000, now)).toBe("just now");
    expect(relativeTime(now - 26 * 3_600_000, now)).toBe("yesterday");
  });
});
