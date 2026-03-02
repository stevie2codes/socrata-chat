"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PortalSelector } from "@/components/chat/portal-selector";
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
          "px-4",
          isHero ? "pt-4 pb-2" : "pt-2 pb-1"
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
              "placeholder:text-muted-foreground/50",
              isHero
                ? "min-h-[100px] text-[15px] font-light"
                : "min-h-[44px] text-sm",
              isLoading && "cursor-not-allowed opacity-60"
            )}
          />
        </div>

        {/* Bottom bar: portal selector (left) + send button (right) */}
        <div className={cn(
          "flex items-center justify-between px-3 py-2.5",
          "border-t border-white/[0.1]"
        )}>
          <PortalSelector
            portal={portal}
            portals={portals}
            onPortalChange={onPortalChange}
          />

          <Button
            type="submit"
            size="icon-sm"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className={cn(
              "shrink-0 rounded-xl border-0 transition-all duration-300",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "shadow-[0_0_24px_oklch(0.68_0.16_250_/_0.35)]",
              "hover:shadow-[0_0_32px_oklch(0.68_0.16_250_/_0.5)]",
              "disabled:bg-white/[0.08] disabled:text-muted-foreground disabled:shadow-none"
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
