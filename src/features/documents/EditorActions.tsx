import { ComingSoon } from "@/components/layout/ComingSoon";
import { HeaderAction } from "@/components/layout/HeaderAction";

interface EditorActionsProps {
  canSave: boolean;
  onSave: () => void;
  onSaveAs: () => void;
  onDelete: () => void;
}

export function EditorActions({ canSave, onSave, onSaveAs, onDelete }: EditorActionsProps) {
  return (
    <>
      <HeaderAction onClick={onSave} disabled={!canSave} shortcut="Ctrl+S">
        Save
      </HeaderAction>
      <HeaderAction onClick={onSaveAs} shortcut="Ctrl+Shift+S">
        Save as
      </HeaderAction>
      <ComingSoon label="Export — coming soon">
        <HeaderAction disabled>Export</HeaderAction>
      </ComingSoon>
      <HeaderAction onClick={onDelete} className="hover:bg-danger hover:text-white">
        Trash
      </HeaderAction>
    </>
  );
}
