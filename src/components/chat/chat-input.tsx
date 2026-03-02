"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Portal } from "@/lib/portals";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  portal: Portal;
  portals: Portal[];
  onPortalChange: (domain: string) => void;
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  textareaRef,
  portal,
  portals,
  onPortalChange,
}: ChatInputProps) {
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
    <form onSubmit={onSubmit} aria-busy={isLoading}>
      <div className="bg-muted/50 border-border focus-within:ring-ring/20 flex items-end gap-0 rounded-2xl border transition-shadow focus-within:ring-2">
        <select
          value={portal.domain}
          onChange={(e) => onPortalChange(e.target.value)}
          aria-label="Select data portal"
          className="text-muted-foreground h-full min-h-[44px] shrink-0 cursor-pointer rounded-l-2xl bg-transparent py-2 pl-3 pr-1 text-sm outline-none"
        >
          {portals.map((p) => (
            <option key={p.domain} value={p.domain}>
              {p.label}
            </option>
          ))}
        </select>
        <div className="border-border/50 my-2 w-px shrink-0 self-stretch bg-current opacity-20" />
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          readOnly={isLoading}
          aria-label="Message input"
          placeholder={`Ask about ${portal.label} data...`}
          rows={1}
          className={cn(
            "max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-relaxed outline-none",
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
          className="m-1.5 shrink-0 rounded-xl"
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
