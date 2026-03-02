"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
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
        nextIndex = (currentIndex - 1 + suggestions.length) % suggestions.length;
      }

      if (nextIndex !== null) {
        buttonRefs.current[nextIndex]?.focus();
      }
    },
    [suggestions.length]
  );

  if (suggestions.length === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label="Follow-up suggestions"
      className="mt-4 flex flex-wrap gap-2"
      onKeyDown={handleKeyDown}
      style={{ animation: "fade-in 0.5s ease-out both" }}
    >
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion}
          ref={(el) => { buttonRefs.current[index] = el; }}
          type="button"
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium",
            "bg-white/[0.07] text-foreground/60",
            "border border-white/[0.12]",
            "transition-all duration-200",
            "hover:bg-white/[0.14] hover:text-foreground/90 hover:border-white/[0.2]",
            "hover:shadow-[0_0_16px_oklch(0.68_0.16_250_/_0.12)]",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/40"
          )}
          tabIndex={index === 0 ? 0 : -1}
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
