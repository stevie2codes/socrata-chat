"use client";

import { cn } from "@/lib/utils";
import { useRovingFocus } from "@/lib/use-roving-focus";

interface StarterPromptsProps {
  suggestions: string[];
  onSelect: (prompt: string) => void;
}

export function StarterPrompts({ suggestions, onSelect }: StarterPromptsProps) {
  const { itemRefs, handleKeyDown } = useRovingFocus(suggestions.length);

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
            itemRefs.current[index] = el;
          }}
          type="button"
          className={cn(
            "glass-pill rounded-full px-4 py-2 text-[13px] font-medium text-foreground/60",
            "hover:text-foreground/90",
            "hover:shadow-[0_0_24px_oklch(0.68_0.16_250_/_0.15)]"
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
