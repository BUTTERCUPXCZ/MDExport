import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDirty, useDocumentsStore } from "@/features/documents/documentsStore";
import { useNoticeStore } from "@/features/notices/noticeStore";
import { documentService } from "@/services/tauri/documents";
import type { DocumentFile } from "@/types/document";

const file = (overrides: Partial<DocumentFile> = {}): DocumentFile => ({
  path: "/lib/a.md",
  name: "a.md",
  content: "# A",
  version: { hash: "h1", modifiedMs: 1 },
  ...overrides,
});

const store = () => useDocumentsStore.getState();
const doc = (id: string) => store().documents[id];

describe("documentsStore", () => {
  beforeEach(() => {
    useDocumentsStore.setState({ documents: {} });
    useNoticeStore.setState({ notice: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds a file once per path", () => {
    const id = store().add(file());
    expect(store().add(file())).toBe(id);
    expect(Object.keys(store().documents)).toHaveLength(1);
  });

  it("tracks unsaved changes", () => {
    const id = store().add(file());
    expect(isDirty(doc(id))).toBe(false);

    store().setContent(id, "# A!");
    expect(isDirty(doc(id))).toBe(true);
  });

  it("saves with the last known version and records the new one", async () => {
    const save = vi.spyOn(documentService, "save").mockResolvedValue({ hash: "h2", modifiedMs: 2 });
    const id = store().add(file());
    store().setContent(id, "# A!");

    await expect(store().save(id)).resolves.toBe("saved");

    expect(save).toHaveBeenCalledWith("/lib/a.md", "# A!", "h1", false);
    expect(doc(id)).toMatchObject({ savedContent: "# A!", version: { hash: "h2" } });
    expect(isDirty(doc(id))).toBe(false);
  });

  it("records a conflict instead of overwriting external edits", async () => {
    vi.spyOn(documentService, "save").mockRejectedValue({
      kind: "conflict",
      message: "changed",
      current: { hash: "disk", modifiedMs: 9 },
    });
    const id = store().add(file());
    store().setContent(id, "mine");

    await expect(store().save(id)).resolves.toBe("conflict");

    expect(doc(id).conflict).toEqual({ hash: "disk", modifiedMs: 9 });
    expect(isDirty(doc(id))).toBe(true);
  });

  it("force-saves to resolve a conflict", async () => {
    const save = vi.spyOn(documentService, "save").mockResolvedValue({ hash: "h3", modifiedMs: 3 });
    const id = store().add(file());

    await store().save(id, { force: true });

    expect(save).toHaveBeenCalledWith("/lib/a.md", "# A", "h1", true);
    expect(doc(id).conflict).toBeNull();
  });

  it("shows other save errors and marks the save failed", async () => {
    vi.spyOn(documentService, "save").mockRejectedValue({
      kind: "permissionDenied",
      message: "Permission denied: /lib/a.md",
    });
    const id = store().add(file());

    await expect(store().save(id)).resolves.toBe("error");

    expect(doc(id).saveState).toBe("error");
    expect(useNoticeStore.getState().notice?.message).toBe("Permission denied: /lib/a.md");
  });

  it("save as points the document at the new file", async () => {
    vi.spyOn(documentService, "saveAs").mockResolvedValue(
      file({
        path: "/lib/copy.md",
        name: "copy.md",
        content: "edited",
        version: { hash: "c", modifiedMs: 4 },
      }),
    );
    const id = store().add(file());
    store().setContent(id, "edited");

    await expect(store().saveAs(id)).resolves.toBe("saved");

    expect(doc(id)).toMatchObject({
      path: "/lib/copy.md",
      name: "copy.md",
      savedContent: "edited",
    });
    expect(isDirty(doc(id))).toBe(false);
  });

  it("save as can be cancelled", async () => {
    vi.spyOn(documentService, "saveAs").mockResolvedValue(null);
    const id = store().add(file());

    await expect(store().saveAs(id)).resolves.toBe("cancelled");
    expect(doc(id).path).toBe("/lib/a.md");
  });

  it("reload replaces content from disk and bumps the revision", async () => {
    vi.spyOn(documentService, "open").mockResolvedValue(
      file({ content: "from disk", version: { hash: "d", modifiedMs: 5 } }),
    );
    const id = store().add(file());
    store().setContent(id, "mine");

    await store().reload(id);

    expect(doc(id)).toMatchObject({ content: "from disk", savedContent: "from disk", revision: 1 });
  });

  it("remove moves the file to trash and closes it", async () => {
    const del = vi.spyOn(documentService, "delete").mockResolvedValue();
    const id = store().add(file());

    await store().remove(id);

    expect(del).toHaveBeenCalledWith("/lib/a.md");
    expect(doc(id)).toBeUndefined();
  });
});
