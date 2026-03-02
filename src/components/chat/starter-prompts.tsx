"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

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
      className="flex flex-wrap justify-center gap-2.5"
      onKeyDown={handleKeyDown}
      style={{ animation: "fade-in 1s ease-out 0.4s both" }}
    >
      {suggestions.map((prompt, index) => (
        <button
          key={prompt}
          ref={(el) => {
            buttonRefs.current[index] = el;
          }}
          type="button"
          className={cn(
            "glass-subtle rounded-full px-4 py-2 text-[13px] font-medium text-muted-foreground",
            "transition-all duration-300",
            "hover:bg-glass-highlight hover:text-foreground/90",
            "hover:shadow-[0_0_20px_oklch(0.68_0.16_250_/_0.12)]",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40"
          )}
          tabIndex={index === 0 ? 0 : -1}
          onClick={() => onSelect(prompt)}
        >
          {prompt.toLowerCase()}
        </button>
      ))}
    </div>
  );
}
