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
  variant?: "hero" | "default";
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
  variant = "default",
}: ChatInputProps) {
  const isHero = variant === "hero";
  const maxTextareaHeight = isHero ? 280 : 200;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxTextareaHeight)}px`;
  }, [input, textareaRef, maxTextareaHeight]);

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
      <div
        className={cn(
          "flex flex-col rounded-2xl transition-all",
          isHero
            ? "gap-0 bg-transparent"
            : "glass gap-0 rounded-2xl"
        )}
      >
        {/* Textarea area */}
        <div className={cn(
          "px-3",
          isHero ? "pt-3 pb-1" : "pt-2 pb-1"
        )}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            readOnly={isLoading}
            aria-label="Message input"
            placeholder={`Ask about ${portal.label} data...`}
            rows={isHero ? 3 : 1}
            className={cn(
              "w-full flex-1 resize-none bg-transparent leading-relaxed outline-none",
              "placeholder:text-foreground/30",
              isHero
                ? "min-h-[120px] text-[15px] font-light"
                : "min-h-[44px] text-sm",
              isLoading && "cursor-not-allowed opacity-60"
            )}
          />
        </div>

        {/* Bottom bar: portal selector (left) + send button (right) */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2">
          <select
            value={portal.domain}
            onChange={(e) => onPortalChange(e.target.value)}
            aria-label="Select data portal"
            className={cn(
              "cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium text-foreground/60 outline-none transition-colors hover:text-foreground/80",
              "bg-white/[0.06] border border-white/[0.1] focus:border-ring/30"
            )}
          >
            {portals.map((p) => (
              <option key={p.domain} value={p.domain} className="bg-background text-foreground">
                {p.label}
              </option>
            ))}
          </select>

          <Button
            type="submit"
            size="icon-sm"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className={cn(
              "shrink-0 rounded-xl border-0 transition-all",
              "bg-primary/90 text-primary-foreground hover:bg-primary",
              "shadow-[0_0_20px_oklch(0.68_0.16_250_/_0.3)]",
              "hover:shadow-[0_0_28px_oklch(0.68_0.16_250_/_0.45)]",
              "disabled:bg-glass disabled:text-muted-foreground disabled:shadow-none"
            )}
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
      </div>
    </form>
  );
}
