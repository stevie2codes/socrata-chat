"use client";

import { useCallback, useRef } from "react";

interface StarterPromptsProps {
  suggestions: string[];
  onSelect: (prompt: string) => void;
}

export function StarterPrompts({ suggestions, onSelect }: StarterPromptsProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = buttonRefs.current.findIndex(
        (ref) => ref === document.activeElement
      );
      if (currentIndex === -1) return;

      let nextIndex: number | null = null;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        nextIndex = (currentIndex + 1) % suggestions.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        nextIndex =
          (currentIndex - 1 + suggestions.length) % suggestions.length;
      }

      if (nextIndex !== null) {
        buttonRefs.current[nextIndex]?.focus();
      }
    },
    [suggestions.length]
  );

  return (
    <div
      role="toolbar"
      aria-label="Suggested starting questions"
      className="flex flex-wrap justify-center gap-x-4 gap-y-2"
      onKeyDown={handleKeyDown}
    >
      {suggestions.map((prompt, index) => (
        <button
          key={prompt}
          ref={(el) => {
            buttonRefs.current[index] = el;
          }}
          type="button"
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 transition-colors hover:underline"
          tabIndex={index === 0 ? 0 : -1}
          onClick={() => onSelect(prompt)}
        >
          {prompt.toLowerCase()}
        </button>
      ))}
    </div>
  );
}
