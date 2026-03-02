"use client"

import { useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"

const STARTER_PROMPTS = [
  "What datasets are available about public safety?",
  "Show me restaurant inspection data",
  "What data is updated most frequently?",
] as const

interface StarterPromptsProps {
  onSelect: (prompt: string) => void
}

export function StarterPrompts({ onSelect }: StarterPromptsProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = buttonRefs.current.findIndex(
        (ref) => ref === document.activeElement
      )
      if (currentIndex === -1) return

      let nextIndex: number | null = null

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault()
        nextIndex = (currentIndex + 1) % STARTER_PROMPTS.length
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault()
        nextIndex =
          (currentIndex - 1 + STARTER_PROMPTS.length) % STARTER_PROMPTS.length
      }

      if (nextIndex !== null) {
        buttonRefs.current[nextIndex]?.focus()
      }
    },
    []
  )

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex max-w-lg flex-col items-center gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Explore Chicago&apos;s Open Data
          </h2>
          <p className="text-muted-foreground text-sm">
            Ask a question or pick a suggestion to get started
          </p>
        </div>

        <div
          role="toolbar"
          aria-label="Suggested starting questions"
          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center"
          onKeyDown={handleKeyDown}
        >
          {STARTER_PROMPTS.map((prompt, index) => (
            <Button
              key={prompt}
              ref={(el) => {
                buttonRefs.current[index] = el
              }}
              variant="outline"
              className="h-auto whitespace-normal px-4 py-3 text-left text-sm"
              tabIndex={index === 0 ? 0 : -1}
              onClick={() => onSelect(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
