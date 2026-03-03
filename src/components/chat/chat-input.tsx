"use client";

import React, { useEffect } from "react";
import { ArrowUp } from "lucide-react";
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
  const maxTextareaHeight = isHero ? 280 : 150;

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

  const hasInput = input.trim().length > 0;

  return (
    <form onSubmit={onSubmit} aria-busy={isLoading}>
      <div
        className={cn(
          "flex flex-col transition-all",
          isHero
            ? "gap-0 rounded-2xl bg-transparent"
            : "glass gap-0 rounded-xl"
        )}
      >
        {/* Textarea */}
        <div className={cn("px-3", isHero ? "pt-4 pb-2" : "pt-2 pb-0.5")}>
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
              "w-full flex-1 resize-none bg-transparent outline-none",
              "placeholder:text-muted-foreground/40",
              isHero
                ? "min-h-[100px] text-[15px] font-light leading-relaxed"
                : "min-h-[36px] text-[13px] leading-snug",
              isLoading && "cursor-not-allowed opacity-60"
            )}
          />
        </div>

        {/* Bottom bar: portal selector + send */}
        <div className={cn(
          "flex items-center justify-between px-2",
          isHero ? "py-2.5 border-t border-white/[0.1]" : "py-1.5"
        )}>
          <PortalSelector
            portal={portal}
            portals={portals}
            onPortalChange={onPortalChange}
          />

          <button
            type="submit"
            disabled={isLoading || !hasInput}
            aria-label="Send message"
            className={cn(
              "flex size-7 items-center justify-center rounded-lg transition-all duration-200",
              hasInput && !isLoading
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_oklch(0.68_0.16_250_/_0.4)] hover:shadow-[0_0_28px_oklch(0.68_0.16_250_/_0.55)] hover:scale-105 active:scale-95"
                : "bg-white/[0.06] text-muted-foreground/40"
            )}
          >
            <ArrowUp className="size-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </form>
  );
}
