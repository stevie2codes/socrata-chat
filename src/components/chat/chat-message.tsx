"use client";

import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  const ariaLabel = isUser
    ? `You said: ${message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join(" ")
        .slice(0, 100)}`
    : "Assistant response";

  return (
    <article
      role="article"
      aria-label={ariaLabel}
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary/10 text-foreground"
            : "text-foreground"
        )}
      >
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <div key={index} className="whitespace-pre-wrap">
                {part.text.split("\n\n").map((paragraph, pIndex) => (
                  <p
                    key={pIndex}
                    className={cn(pIndex > 0 && "mt-3")}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            );
          }

          if (part.type === "tool-invocation") {
            return (
              <div
                key={index}
                className="text-muted-foreground my-2 flex items-center gap-2 text-xs italic"
              >
                <span className="bg-muted-foreground/20 inline-block size-3 animate-pulse rounded-full" />
                Querying data...
              </div>
            );
          }

          return null;
        })}
      </div>
    </article>
  );
}
