"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ArrowUp, Square } from "lucide-react";
import { PortalSelector } from "@/components/chat/portal-selector";
import { cn } from "@/lib/utils";
import type { Portal } from "@/lib/portals";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onStop?: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  portal: Portal;
  portals: Portal[];
  onPortalChange: (domain: string) => void;
  variant?: "hero" | "default";
}

const ROTATING_HINTS = [
  "How many building permits were issued this year?",
  "Show me crime trends by neighborhood",
  "What restaurants failed health inspections?",
  "Compare 311 complaints across districts",
  "What are the top causes of service requests?",
];

function useRotatingText(texts: string[], intervalMs = 4000) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % texts.length);
        setVisible(true);
      }, 300);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [texts.length, intervalMs]);

  return { text: texts[index], visible };
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  onStop,
  textareaRef,
  portal,
  portals,
  onPortalChange,
  variant = "default",
}: ChatInputProps) {
  const isHero = variant === "hero";
  const maxTextareaHeight = isHero ? 180 : 150;
  const [focused, setFocused] = useState(false);
  const { text: hint, visible: hintVisible } = useRotatingText(ROTATING_HINTS);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxTextareaHeight)}px`;
  }, [input, textareaRef, maxTextareaHeight]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isLoading && input.trim()) {
          onSubmit(e as unknown as React.FormEvent);
        }
      }
    },
    [input, isLoading, onSubmit]
  );

  const hasInput = input.trim().length > 0;
  const showRotatingHint = isHero && !hasInput && !focused;

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
        <div className={cn("relative", isHero ? "px-4 pt-3 pb-1" : "px-3 pt-2 pb-0.5")}>
          {/* Rotating placeholder overlay for hero */}
          {showRotatingHint && (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 flex items-start px-4 pt-3",
                "text-[15px] font-light text-muted-foreground/60",
                "transition-opacity duration-300",
                hintVisible ? "opacity-100" : "opacity-0"
              )}
              aria-hidden="true"
            >
              {hint}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            readOnly={isLoading}
            aria-label="Message input"
            placeholder={isHero ? undefined : `Ask about ${portal.label} data...`}
            rows={isHero ? 2 : 1}
            className={cn(
              "relative z-[1] w-full flex-1 resize-none bg-transparent outline-none",
              "placeholder:text-muted-foreground/40",
              isHero
                ? "min-h-[56px] text-[15px] font-light leading-relaxed"
                : "min-h-[36px] text-[13px] leading-snug",
              isLoading && "cursor-not-allowed opacity-60"
            )}
          />
        </div>

        {/* Bottom bar: portal selector + send */}
        <div className={cn(
          "flex items-center justify-between px-2",
          isHero ? "px-3 py-2 border-t border-white/[0.06]" : "py-1.5"
        )}>
          <PortalSelector
            portal={portal}
            portals={portals}
            onPortalChange={onPortalChange}
          />

          {isLoading && onStop ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              className={cn(
                "flex items-center justify-center rounded-lg transition-all duration-200",
                isHero ? "size-8" : "size-7",
                "bg-white/[0.1] text-muted-foreground hover:bg-white/[0.15] hover:text-foreground active:scale-95"
              )}
            >
              <Square className={cn(isHero ? "size-3" : "size-2.5")} strokeWidth={0} fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !hasInput}
              aria-label="Send message"
              className={cn(
                "flex items-center justify-center rounded-lg transition-all duration-200",
                isHero ? "size-8" : "size-7",
                hasInput && !isLoading
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_oklch(0.68_0.16_250_/_0.4)] hover:shadow-[0_0_28px_oklch(0.68_0.16_250_/_0.55)] hover:scale-105 active:scale-95"
                  : "bg-white/[0.06] text-muted-foreground/40"
              )}
            >
              <ArrowUp className={cn(isHero ? "size-4" : "size-3.5")} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
