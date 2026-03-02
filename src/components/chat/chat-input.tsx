"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  textareaRef,
}: ChatInputProps) {
  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input, textareaRef]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={isLoading}
      className="border-border/50 bg-background sticky bottom-0 border-t px-4 py-3"
    >
      <div className="bg-muted/50 border-border focus-within:ring-ring/20 flex items-end gap-2 rounded-2xl border px-3 py-2 transition-shadow focus-within:ring-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          readOnly={isLoading}
          aria-label="Message input"
          placeholder="Ask about Chicago public data..."
          rows={1}
          className={cn(
            "max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none",
            "placeholder:text-muted-foreground/60",
            isLoading && "cursor-not-allowed opacity-60"
          )}
        />
        <Button
          type="submit"
          size="icon-sm"
          variant="default"
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          className="mb-0.5 shrink-0 rounded-xl"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4"
          >
            <path
              fillRule="evenodd"
              d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </div>
    </form>
  );
}
