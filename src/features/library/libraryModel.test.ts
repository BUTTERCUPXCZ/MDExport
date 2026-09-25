import { describe, expect, it } from "vitest";
import {
  channelGroups,
  folderOf,
  HOME,
  initials,
  recentDocuments,
  relativeTime,
  serverOf,
  sidebarOrder,
  stem,
  topLevelFolders,
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
  it("splits relative paths into folder and server", () => {
    expect(folderOf("a/b/c.md")).toBe("a/b");
    expect(folderOf("c.md")).toBe("");
    expect(serverOf("backend/bugs/x.md")).toBe("backend");
    expect(serverOf("Readme.md")).toBe(HOME);
  });

  it("lists top-level folders as servers", () => {
    expect(topLevelFolders(listing)).toEqual(["backend", "frontend"]);
  });

  it("groups a server's files into uncategorized + categories, including empty ones", () => {
    const groups = channelGroups(listing, "backend");

    expect(groups.map((g) => [g.category, g.folder, g.documents.map((d) => d.name)])).toEqual([
      [null, "backend", ["api.md"]],
      ["bugs", "backend/bugs", ["login-500.md"]],
      ["empty", "backend/empty", []],
      ["handovers", "backend/handovers", ["auth-flow.md", "Payments.md"]],
    ]);
  });

  it("Home shows only root files", () => {
    const groups = channelGroups(listing, HOME);
    expect(groups).toEqual([{ category: null, folder: "", documents: [listing.documents[0]] }]);
  });

  it("gives sidebar order for keyboard navigation", () => {
    expect(sidebarOrder(listing, "backend").map((d) => d.name)).toEqual([
      "api.md",
      "login-500.md",
      "auth-flow.md",
      "Payments.md",
    ]);
  });

  it("sorts recent documents newest first", () => {
    expect(recentDocuments(listing.documents, 2).map((d) => d.name)).toEqual([
      "login-500.md",
      "api.md",
    ]);
  });

  it("formats names", () => {
    expect(stem("auth-flow.md")).toBe("auth-flow");
    expect(stem("notes.markdown")).toBe("notes");
    expect(initials("backend")).toBe("B");
    expect(initials("only-automation")).toBe("OA");
    expect(initials("Ride Flow API v2")).toBe("RFA");
  });

  it("formats relative times", () => {
    const now = 1_000_000_000_000;
    expect(relativeTime(now - 10_000, now)).toBe("just now");
    expect(relativeTime(now - 5 * 60_000, now)).toBe("5 min ago");
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe("3 h ago");
    expect(relativeTime(now - 26 * 3_600_000, now)).toBe("yesterday");
    expect(relativeTime(now - 3 * 86_400_000, now)).toBe("3 days ago");
  });
});
