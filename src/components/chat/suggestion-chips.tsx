"use client";

import { cn } from "@/lib/utils";
import { useRovingFocus } from "@/lib/use-roving-focus";

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  const { itemRefs, handleKeyDown } = useRovingFocus(suggestions.length);

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
          ref={(el) => { itemRefs.current[index] = el; }}
          type="button"
          className={cn(
            "glass-pill rounded-full px-3 py-1.5 text-xs font-medium text-foreground/60",
            "hover:text-foreground/90",
            "hover:shadow-[0_0_16px_oklch(0.68_0.16_250_/_0.12)]"
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
