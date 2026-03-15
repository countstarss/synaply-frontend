"use client";

import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export interface CommandPaletteAction {
  id: string;
  label: string;
  group?: string;
  shortcut?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  actions: CommandPaletteAction[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({
  actions,
  open: controlledOpen,
  onOpenChange,
}: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const pressedK = event.key.toLowerCase() === "k";
      if ((event.metaKey || event.ctrlKey) && pressedK) {
        event.preventDefault();
        setOpen(!open);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  const grouped = actions.reduce<Record<string, CommandPaletteAction[]>>(
    (accumulator, action) => {
      const group = action.group || "General";
      if (!accumulator[group]) {
        accumulator[group] = [];
      }
      accumulator[group].push(action);
      return accumulator;
    },
    {},
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Dashboard Commands"
      description="Run dashboard actions quickly"
      className="max-w-xl"
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No matching command.</CommandEmpty>
        {Object.entries(grouped).map(([group, groupActions], index) => (
          <div key={group}>
            {index > 0 ? <CommandSeparator /> : null}
            <CommandGroup heading={group}>
              {groupActions.map((action) => (
                <CommandItem
                  key={action.id}
                  onSelect={() => {
                    action.onSelect();
                    setOpen(false);
                  }}
                >
                  {action.label}
                  {action.shortcut ? (
                    <CommandShortcut>{action.shortcut}</CommandShortcut>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
