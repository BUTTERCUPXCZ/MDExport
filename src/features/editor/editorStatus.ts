import { useSyncExternalStore } from "react";

/** Cursor + document stats shown in the status bar while an editor is open. */
export interface EditorStatus {
  line: number;
  column: number;
  words: number;
}

let status: EditorStatus | null = null;
const listeners = new Set<() => void>();

export const editorStatusStore = {
  get: () => status,
  set(next: EditorStatus | null) {
    status = next;
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useEditorStatus(): EditorStatus | null {
  return useSyncExternalStore(editorStatusStore.subscribe, editorStatusStore.get);
}
