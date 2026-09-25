/** Every keyboard shortcut, shown in the Ctrl+/ sheet and Settings → Keybinds. */
export const SHORTCUT_GROUPS = [
  {
    title: "Navigation",
    items: [
      ["Quick switcher", ["Ctrl", "K"]],
      ["Quick switcher (alternative)", ["Ctrl", "P"]],
      ["Previous document in sidebar", ["Ctrl", "Page Up"]],
      ["Next document in sidebar", ["Ctrl", "Page Down"]],
      ["Settings", ["Ctrl", ","]],
      ["Keyboard shortcuts", ["Ctrl", "/"]],
    ],
  },
  {
    title: "Documents",
    items: [
      ["New document", ["Ctrl", "N"]],
      ["Open file", ["Ctrl", "O"]],
      ["Save", ["Ctrl", "S"]],
      ["Save as", ["Ctrl", "Shift", "S"]],
    ],
  },
  {
    title: "Editor",
    items: [
      ["Switch view (edit / split / preview)", ["Ctrl", "\\"]],
      ["Bold", ["Ctrl", "B"]],
      ["Italic", ["Ctrl", "I"]],
      ["Undo", ["Ctrl", "Z"]],
      ["Redo", ["Ctrl", "Shift", "Z"]],
      ["Move line up / down", ["Alt", "↑ / ↓"]],
    ],
  },
] as const;
