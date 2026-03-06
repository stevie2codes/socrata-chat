"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingBlockProps {
  /** The reasoning text shown before/between tool calls */
  text: string;
  /** Whether the assistant is still streaming */
  isStreaming?: boolean;
}

export function ThinkingBlock({ text, isStreaming = false }: ThinkingBlockProps) {
  const [open, setOpen] = useState(false);
  // Auto-open while streaming so the user sees the thinking text appear live,
  // then auto-collapse once streaming ends (user can still manually toggle).
  const wasStreamingRef = useRef(false);
  useEffect(() => {
    if (isStreaming && !wasStreamingRef.current) {
      setOpen(true);
      wasStreamingRef.current = true;
    }
    if (!isStreaming && wasStreamingRef.current) {
      setOpen(false);
      wasStreamingRef.current = false;
    }
  }, [isStreaming]);

  if (!text.trim()) return null;

  return (
    <div className="mb-3 max-w-[720px]">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "group flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
          "text-muted-foreground/70 hover:text-muted-foreground hover:bg-white/[0.04]"
        )}
        aria-expanded={open}
      >
        <ChevronRight
          className={cn(
            "size-3 transition-transform duration-200",
            open && "rotate-90"
          )}
        />
        {isStreaming ? (
          <span className="flex items-center gap-1.5">
            Thinking
            <span className="flex items-center gap-0.5">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="size-1 rounded-full"
                  style={{
                    background: "var(--muted-foreground)",
                    opacity: 0.5,
                    animation: `pulse-dot 1.4s ease-in-out ${delay}ms infinite`,
                  }}
                />
              ))}
            </span>
          </span>
        ) : (
          "Thought process"
        )}
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "mt-1 ml-2 border-l-2 border-white/[0.08] pl-3 text-xs leading-relaxed text-muted-foreground/60",
              "whitespace-pre-wrap"
            )}
          >
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}
