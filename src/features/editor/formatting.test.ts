import { EditorSelection, EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { toggleInlineMarker } from "@/features/editor/formatting";

function apply(doc: string, from: number, to: number, marker: string) {
  const state = EditorState.create({ doc, selection: EditorSelection.single(from, to) });
  const next = state.update(toggleInlineMarker(state, marker)).state;
  const { from: selFrom, to: selTo } = next.selection.main;
  return { doc: next.doc.toString(), selected: next.sliceDoc(selFrom, selTo), cursor: selFrom };
}

describe("toggleInlineMarker", () => {
  it("wraps the selection and keeps it selected", () => {
    expect(apply("make this bold", 5, 9, "**")).toEqual({
      doc: "make **this** bold",
      selected: "this",
      cursor: 7,
    });
  });

  it("unwraps an already wrapped selection", () => {
    expect(apply("make **this** bold", 7, 11, "**")).toEqual({
      doc: "make this bold",
      selected: "this",
      cursor: 5,
    });
  });

  it("inserts an empty pair with the cursor inside when nothing is selected", () => {
    expect(apply("ab", 1, 1, "_")).toEqual({ doc: "a__b", selected: "", cursor: 2 });
  });

  it("handles multiple selection ranges", () => {
    const state = EditorState.create({
      doc: "one two",
      selection: EditorSelection.create([EditorSelection.range(0, 3), EditorSelection.range(4, 7)]),
      extensions: EditorState.allowMultipleSelections.of(true),
    });
    const next = state.update(toggleInlineMarker(state, "_")).state;
    expect(next.doc.toString()).toBe("_one_ _two_");
  });
});
