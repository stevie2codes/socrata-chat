export type Shortcut = {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  description: string
  action: () => void
}

export type ShortcutDefinition = {
  id: string
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  description: string
}

/**
 * Default shortcut definitions. Actions are bound at runtime by the consuming
 * component — these only describe the key combos and their purpose.
 */
export const SHORTCUTS: ShortcutDefinition[] = [
  {
    id: "focus-input",
    key: "/",
    description: "Focus chat input",
  },
  {
    id: "focus-input-alt",
    key: "i",
    ctrl: true,
    description: "Focus chat input",
  },
  {
    id: "show-help",
    key: "?",
    description: "Show keyboard shortcuts help",
  },
  {
    id: "toggle-sidebar",
    key: "b",
    ctrl: true,
    description: "Toggle sidebar",
  },
  {
    id: "escape",
    key: "Escape",
    description: "Blur current focus / return to message list",
  },
  {
    id: "export-results",
    key: "e",
    ctrl: true,
    description: "Export current results",
  },
]

/**
 * Shortcut descriptions formatted for the help dialog. Deduplicates entries
 * that share a description (e.g. `/` and `Ctrl+I` both focus the input) by
 * combining their key labels.
 */
export const SHORTCUT_DESCRIPTIONS: {
  keys: string[]
  description: string
}[] = (() => {
  const grouped = new Map<string, string[]>()

  for (const shortcut of SHORTCUTS) {
    const parts: string[] = []
    if (shortcut.ctrl) parts.push("Ctrl")
    if (shortcut.meta) parts.push("Cmd")
    if (shortcut.shift) parts.push("Shift")
    parts.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key)
    const label = parts.join("+")

    const existing = grouped.get(shortcut.description)
    if (existing) {
      existing.push(label)
    } else {
      grouped.set(shortcut.description, [label])
    }
  }

  return Array.from(grouped.entries()).map(([description, keys]) => ({
    keys,
    description,
  }))
})()

function buildShortcutKey(event: KeyboardEvent): string {
  const parts: string[] = []
  if (event.ctrlKey) parts.push("ctrl")
  if (event.metaKey) parts.push("meta")
  if (event.shiftKey) parts.push("shift")
  parts.push(event.key.toLowerCase())
  return parts.join("+")
}

function definitionToKey(def: ShortcutDefinition): string {
  const parts: string[] = []
  if (def.ctrl) parts.push("ctrl")
  if (def.meta) parts.push("meta")
  if (def.shift) parts.push("shift")
  parts.push(def.key.toLowerCase())
  return parts.join("+")
}

/**
 * Creates a keyboard event handler that dispatches to registered shortcut
 * actions. The `shortcuts` map keys should be shortcut definition IDs
 * (matching `SHORTCUTS[n].id`).
 *
 * When the event target is an input or textarea, only the Escape shortcut
 * is handled — all other keys are left to the native input behavior.
 */
export function createShortcutHandler(
  shortcuts: Map<string, () => void>
): (event: KeyboardEvent) => void {
  // Build a lookup from normalized key combo to action
  const keyMap = new Map<string, () => void>()

  for (const def of SHORTCUTS) {
    const action = shortcuts.get(def.id)
    if (action) {
      keyMap.set(definitionToKey(def), action)
    }
  }

  return (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    const isInput =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.getAttribute("contenteditable") === "true"

    const combo = buildShortcutKey(event)

    // Inside inputs, only handle Escape
    if (isInput) {
      if (event.key === "Escape") {
        const action = keyMap.get("escape")
        if (action) {
          event.preventDefault()
          action()
        }
      }
      return
    }

    const action = keyMap.get(combo)
    if (action) {
      event.preventDefault()
      action()
    }
  }
}
