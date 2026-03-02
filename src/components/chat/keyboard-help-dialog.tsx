"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SHORTCUT_DESCRIPTIONS } from "@/lib/keyboard-shortcuts"

interface KeyboardHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardHelpDialog({
  open,
  onOpenChange,
}: KeyboardHelpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Navigate the interface quickly with these shortcuts.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2" role="list" aria-label="Keyboard shortcuts">
          {SHORTCUT_DESCRIPTIONS.map(({ keys, description }) => (
            <div
              key={description}
              className="flex items-center justify-between gap-4"
              role="listitem"
            >
              <span className="text-muted-foreground text-sm">
                {description}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {keys.map((key, index) => (
                  <span key={key} className="flex items-center gap-1.5">
                    {index > 0 && (
                      <span className="text-muted-foreground text-xs">or</span>
                    )}
                    {key.split("+").map((part, partIndex) => (
                      <span key={partIndex} className="flex items-center gap-0.5">
                        {partIndex > 0 && (
                          <span className="text-muted-foreground text-xs">+</span>
                        )}
                        <kbd className="bg-muted text-muted-foreground border-border inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 font-mono text-xs font-medium">
                          {part}
                        </kbd>
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
