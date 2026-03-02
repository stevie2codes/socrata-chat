"use client";

import type { UIMessage } from "ai";
import { isToolUIPart, getToolName } from "ai";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/chat/markdown-content";

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

const TOOL_LABELS: Record<string, string> = {
  search_datasets: "Searching datasets",
  get_dataset_info: "Reading dataset schema",
  query_dataset: "Querying data",
};

function extractVisibleText(parts: UIMessage["parts"]): string {
  const COMPLETED = new Set(["output-available", "output-error", "output-denied"]);

  let lastCompletedToolIndex = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (isToolUIPart(parts[i]) && COMPLETED.has((parts[i] as any).state)) {
      lastCompletedToolIndex = i;
      break;
    }
  }

  // No tools called — show all text (plain conversation)
  if (lastCompletedToolIndex === -1) {
    return parts.filter((p) => p.type === "text").map((p) => p.text).join("\n\n");
  }

  // Only text after the last completed tool
  return parts
    .slice(lastCompletedToolIndex + 1)
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n\n");
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === "user";

  const textContent = extractVisibleText(message.parts);

  const COMPLETED_TOOL_STATES = new Set(["output-available", "output-error", "output-denied"]);
  const activeToolPart = isStreaming
    ? [...message.parts]
        .reverse()
        .find(
          (part) =>
            isToolUIPart(part) && !COMPLETED_TOOL_STATES.has(part.state)
        )
    : null;

  const activeToolName =
    activeToolPart && isToolUIPart(activeToolPart)
      ? getToolName(activeToolPart)
      : null;

  const hasText = textContent.trim().length > 0;

  const isOnlyTools =
    !hasText &&
    message.parts.every(
      (part) => isToolUIPart(part) || (part.type === "text" && !part.text.trim())
    );

  const ariaLabel = isUser
    ? `You said: ${textContent.slice(0, 100)}`
    : "Assistant response";

  if (isUser) {
    return (
      <article role="article" aria-label={ariaLabel} className="flex w-full justify-end">
        <div
          className={cn(
            "glass max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
            "border-primary/20 bg-primary/8"
          )}
        >
          <p className="whitespace-pre-wrap">{textContent}</p>
        </div>
      </article>
    );
  }

  return (
    <article role="article" aria-label={ariaLabel} className="flex w-full justify-start">
      <div className="max-w-full text-sm leading-[1.7]">
        {hasText && <MarkdownContent content={textContent} />}

        {isStreaming && hasText && (
          <span
            className="ml-0.5 inline-block h-4 w-0.5 align-middle"
            style={{
              background: "var(--primary)",
              boxShadow: "0 0 8px var(--glow)",
              animation: "glow-pulse 1s ease-in-out infinite",
            }}
          />
        )}

        {isStreaming && activeToolName && (
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-0.5 w-32 overflow-hidden rounded-full bg-glass">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent, var(--primary), transparent)",
                  animation: "shimmer 1.8s ease-in-out infinite",
                }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {TOOL_LABELS[activeToolName] ?? "Working"}...
            </span>
          </div>
        )}

        {isStreaming && isOnlyTools && !activeToolName && (
          <div className="flex items-center gap-3">
            <div className="relative h-0.5 w-32 overflow-hidden rounded-full bg-glass">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent, var(--primary), transparent)",
                  animation: "shimmer 1.8s ease-in-out infinite",
                }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Working...</span>
          </div>
        )}
      </div>
    </article>
  );
}
