"use client";

import type { UIMessage } from "ai";
import { isToolUIPart, getToolName } from "ai";
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

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Collect all text parts into one string for markdown rendering
  const textContent = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");

  // Find the latest active tool invocation (for streaming status).
  // In AI SDK v6, completed tool states are "output-available", "output-error", "output-denied".
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

  // Check if we have any completed text to show
  const hasText = textContent.trim().length > 0;

  // Check if all parts are tool invocations (no final text yet)
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
        <div className="bg-primary/10 max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed">
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
          <span className="bg-data-1 ml-0.5 inline-block h-4 w-0.5 animate-pulse align-middle" />
        )}

        {isStreaming && activeToolName && (
          <div className="mt-3 flex items-center gap-3">
            <div className="bg-muted relative h-0.5 w-32 overflow-hidden rounded-full">
              <div className="bg-data-1/60 absolute inset-0 animate-[shimmer_1.5s_ease-in-out_infinite]" />
            </div>
            <span className="text-muted-foreground text-xs">
              {TOOL_LABELS[activeToolName] ?? "Working"}...
            </span>
          </div>
        )}

        {isStreaming && isOnlyTools && !activeToolName && (
          <div className="flex items-center gap-3">
            <div className="bg-muted relative h-0.5 w-32 overflow-hidden rounded-full">
              <div className="bg-data-1/60 absolute inset-0 animate-[shimmer_1.5s_ease-in-out_infinite]" />
            </div>
            <span className="text-muted-foreground text-xs">Working...</span>
          </div>
        )}
      </div>
    </article>
  );
}
