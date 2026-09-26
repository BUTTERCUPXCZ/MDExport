import { FilePlus2, FolderPlus, Plus } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUiStore } from "@/features/ui/uiStore";

const item =
  "flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-[13px] text-text-2 outline-none data-highlighted:bg-accent-soft data-highlighted:text-text [&_svg]:size-4 [&_svg]:text-muted";

/**
 * The "+" at the top of the library index: New document / New folder, named
 * inline in `folder` (the open document's folder, or the library root).
 */
export function CreateMenu({ folder }: { folder: string }) {
  const startCreating = useUiStore((s) => s.startCreating);

  return (
    <DropdownMenu.Root>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenu.Trigger
            aria-label="Create"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors outline-none hover:bg-raised hover:text-text focus-visible:ring-2 focus-visible:ring-accent data-[state=open]:bg-raised data-[state=open]:text-text"
          >
            <Plus className="size-4" />
          </DropdownMenu.Trigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">New document or folder</TooltipContent>
      </Tooltip>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          // Leave focus alone on close, so the name field keeps it.
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="z-50 w-[200px] rounded-lg border border-line bg-raised p-1 shadow-float"
        >
          <DropdownMenu.Item className={item} onSelect={() => startCreating("document", folder)}>
            <FilePlus2 />
            New document
          </DropdownMenu.Item>
          <DropdownMenu.Item className={item} onSelect={() => startCreating("folder", folder)}>
            <FolderPlus />
            New folder
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
