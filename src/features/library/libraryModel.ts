import type { LibraryEntry, LibraryListing } from "@/types/library";

/** Folder part of a relative path: `a/b/c.md` → `a/b`, `c.md` → `""`. */
export function folderOf(relativePath: string): string {
  const slash = relativePath.lastIndexOf("/");
  return slash === -1 ? "" : relativePath.slice(0, slash);
}

/** `auth-flow.md` → `auth-flow` */
export function stem(name: string): string {
  return name.replace(/\.(md|markdown)$/i, "");
}

/** A folder in the library index, with its documents and subfolders. */
export interface FolderNode {
  /** Relative path, `/`-separated; `""` for the library root. */
  path: string;
  /** Last path segment; `""` for the root. */
  name: string;
  folders: FolderNode[];
  documents: LibraryEntry[];
  /** Documents in this folder and all subfolders. */
  total: number;
}

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });

/**
 * The whole library as a tree: root documents first, then folders (including
 * empty ones, so documents can be added to them), each sorted by name.
 */
export function libraryTree(listing: LibraryListing): FolderNode {
  const root: FolderNode = { path: "", name: "", folders: [], documents: [], total: 0 };
  const nodes = new Map<string, FolderNode>([["", root]]);

  const ensure = (path: string): FolderNode => {
    const existing = nodes.get(path);
    if (existing) return existing;
    const parent = ensure(folderOf(path));
    const node: FolderNode = {
      path,
      name: path.slice(path.lastIndexOf("/") + 1),
      folders: [],
      documents: [],
      total: 0,
    };
    parent.folders.push(node);
    nodes.set(path, node);
    return node;
  };

  for (const folder of listing.folders) ensure(folder);
  for (const doc of listing.documents) ensure(folderOf(doc.relativePath)).documents.push(doc);

  const finish = (node: FolderNode): number => {
    node.documents.sort(byName);
    node.folders.sort(byName);
    node.total = node.documents.length + node.folders.reduce((n, f) => n + finish(f), 0);
    return node.total;
  };
  finish(root);
  return root;
}

/** Documents in index order (used by Ctrl+PageUp / Ctrl+PageDown). */
export function libraryOrder(listing: LibraryListing): LibraryEntry[] {
  const out: LibraryEntry[] = [];
  const walk = (node: FolderNode) => {
    out.push(...node.documents);
    node.folders.forEach(walk);
  };
  walk(libraryTree(listing));
  return out;
}

export function recentDocuments(documents: LibraryEntry[], limit: number): LibraryEntry[] {
  return [...documents].sort((a, b) => b.modifiedMs - a.modifiedMs).slice(0, limit);
}

export function entryForPath(listing: LibraryListing | null, path: string) {
  return listing?.documents.find((d) => d.path === path) ?? null;
}

/** Compact age for index rows: "now", "5m", "3h", "2d", "Sep 12". */
export function shortAge(ms: number, now = Date.now()): string {
  const minutes = Math.round((now - ms) / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
