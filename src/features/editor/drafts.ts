/**
 * In-memory document drafts, keyed by document id.
 * Temporary: Phase 4 replaces this with real .md files on disk.
 */
const drafts = new Map<string, string>();

export const draftStore = {
  get: (documentId: string): string => drafts.get(documentId) ?? "",
  set: (documentId: string, content: string) => drafts.set(documentId, content),
  clear: () => drafts.clear(),
};
