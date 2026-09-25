import { EditorSelection, type EditorState, type TransactionSpec } from "@codemirror/state";
import type { Command } from "@codemirror/view";

/**
 * Toggles an inline marker (e.g. `**` or `_`) around every selection range.
 * - Selected text already wrapped → unwrap it.
 * - Empty selection → insert the pair and place the cursor between them.
 */
export function toggleInlineMarker(state: EditorState, marker: string): TransactionSpec {
  const len = marker.length;

  return state.changeByRange((range) => {
    const before = state.sliceDoc(range.from - len, range.from);
    const after = state.sliceDoc(range.to, range.to + len);

    if (before === marker && after === marker) {
      return {
        changes: [
          { from: range.from - len, to: range.from, insert: "" },
          { from: range.to, to: range.to + len, insert: "" },
        ],
        range: EditorSelection.range(range.from - len, range.to - len),
      };
    }

    return {
      changes: [
        { from: range.from, insert: marker },
        { from: range.to, insert: marker },
      ],
      range: EditorSelection.range(range.from + len, range.to + len),
    };
  });
}

function markerCommand(marker: string): Command {
  return (view) => {
    view.dispatch(
      view.state.update(toggleInlineMarker(view.state, marker), { scrollIntoView: true }),
    );
    return true;
  };
}

export const toggleBold = markerCommand("**");
export const toggleItalic = markerCommand("_");
