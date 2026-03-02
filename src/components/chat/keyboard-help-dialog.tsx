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
      <DialogContent className="glass-strong sm:max-w-md border-glass-border bg-transparent">
        <DialogHeader>
          <DialogTitle className="text-foreground/90">Keyboard Shortcuts</DialogTitle>
          <DialogDescription className="text-muted-foreground">
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
              <span className="text-sm text-muted-foreground">
                {description}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {keys.map((key, index) => (
                  <span key={key} className="flex items-center gap-1.5">
                    {index > 0 && (
                      <span className="text-xs text-muted-foreground/60">or</span>
                    )}
                    {key.split("+").map((part, partIndex) => (
                      <span key={partIndex} className="flex items-center gap-0.5">
                        {partIndex > 0 && (
                          <span className="text-xs text-muted-foreground/60">+</span>
                        )}
                        <kbd className="glass inline-flex h-6 min-w-6 items-center justify-center rounded-lg px-1.5 font-mono text-xs font-medium text-muted-foreground">
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
