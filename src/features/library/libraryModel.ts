import type { LibraryEntry, LibraryListing } from "@/types/library";

/**
 * How the library maps onto the Discord-style layout:
 * - Top-level folders are "servers" in the rail. The library root is Home.
 * - Files are "channels". Nested folders are collapsible "categories".
 */

/** The Home server (files directly in the library folder). */
export const HOME = "";

/** Folder part of a relative path: `a/b/c.md` → `a/b`, `c.md` → `""`. */
export function folderOf(relativePath: string): string {
  const slash = relativePath.lastIndexOf("/");
  return slash === -1 ? "" : relativePath.slice(0, slash);
}

/** Top-level folder ("server") of a relative path, or HOME for root files. */
export function serverOf(relativePath: string): string {
  const slash = relativePath.indexOf("/");
  return slash === -1 ? HOME : relativePath.slice(0, slash);
}

export function topLevelFolders(listing: LibraryListing): string[] {
  return listing.folders.filter((f) => !f.includes("/"));
}

/** `auth-flow.md` → `auth-flow` */
export function stem(name: string): string {
  return name.replace(/\.(md|markdown)$/i, "");
}

/** Discord-style server initials: "only automation" → "OA", "backend" → "B". */
export function initials(name: string): string {
  const words = name.split(/[\s_\-.]+/).filter(Boolean);
  return (
    words
      .slice(0, 3)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}

export interface ChannelGroup {
  /** Category label relative to the server, e.g. `handovers` or `bugs/2024`; null = uncategorized. */
  category: string | null;
  /** Full folder path relative to the library (where new documents in this group go). */
  folder: string;
  documents: LibraryEntry[];
}

const byName = (a: LibraryEntry, b: LibraryEntry) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });

/**
 * Sidebar groups for a server: uncategorized files first, then one category per
 * nested folder (including empty ones, so you can add documents to them).
 */
export function channelGroups(listing: LibraryListing, server: string): ChannelGroup[] {
  const groups = new Map<string, ChannelGroup>();
  const ensure = (folder: string) => {
    let group = groups.get(folder);
    if (!group) {
      const category = folder === server ? null : folder.slice(server ? server.length + 1 : 0);
      group = { category, folder, documents: [] };
      groups.set(folder, group);
    }
    return group;
  };

  ensure(server);
  if (server !== HOME) {
    for (const folder of listing.folders) {
      if (folder.startsWith(`${server}/`)) ensure(folder);
    }
  }
  for (const doc of listing.documents) {
    const folder = folderOf(doc.relativePath);
    const inServer =
      server === HOME ? folder === HOME : folder === server || folder.startsWith(`${server}/`);
    if (inServer) ensure(folder).documents.push(doc);
  }

  for (const group of groups.values()) group.documents.sort(byName);
  return [...groups.values()].sort((a, b) => {
    if (a.category === null) return -1;
    if (b.category === null) return 1;
    return a.category.localeCompare(b.category, undefined, { sensitivity: "base" });
  });
}

/** Documents in a server, in sidebar order (used for Ctrl+PageUp/PageDown). */
export function sidebarOrder(listing: LibraryListing, server: string): LibraryEntry[] {
  return channelGroups(listing, server).flatMap((g) => g.documents);
}

export function recentDocuments(documents: LibraryEntry[], limit: number): LibraryEntry[] {
  return [...documents].sort((a, b) => b.modifiedMs - a.modifiedMs).slice(0, limit);
}

export function entryForPath(listing: LibraryListing | null, path: string) {
  return listing?.documents.find((d) => d.path === path) ?? null;
}

/** "3 min ago", "yesterday", "Sep 12" — for recent-document lists. */
export function relativeTime(ms: number, now = Date.now()): string {
  const seconds = Math.round((now - ms) / 1000);
  if (seconds < 45) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
