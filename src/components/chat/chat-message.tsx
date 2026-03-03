"use client";

import type { UIMessage } from "ai";
import { isToolUIPart, getToolName } from "ai";
import { cn } from "@/lib/utils";
import { parseSuggestions, getHeuristicSuggestions } from "@/lib/suggestions";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { ToolResultRenderer } from "@/components/chat/tool-result-renderer";
import { ErrorCallout } from "@/components/data/error-callout";
import { SuggestionChips } from "@/components/chat/suggestion-chips";
import type { QueryConfirmation } from "@/types";

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
  isLast?: boolean;
  onSuggestionSelect?: (suggestion: string) => void;
  onConfirmRun?: (confirmation: QueryConfirmation) => void;
  onConfirmAdjust?: () => void;
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

export function ChatMessage({ message, isStreaming = false, isLast = false, onSuggestionSelect, onConfirmRun, onConfirmAdjust }: ChatMessageProps) {
  const isUser = message.role === "user";

  const rawText = extractVisibleText(message.parts);
  const { cleanText: textContent, suggestions: parsedSuggestions } = parseSuggestions(rawText);

  const toolNames = message.parts
    .filter((part) => isToolUIPart(part))
    .map((part) => getToolName(part));

  const suggestions = !isStreaming && isLast
    ? (parsedSuggestions.length > 0 ? parsedSuggestions : getHeuristicSuggestions(toolNames))
    : [];

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

        {/* Render completed tool results */}
        {message.parts
          .filter(
            (part): part is Extract<typeof part, { state: string }> =>
              isToolUIPart(part) && part.state === "output-available"
          )
          .map((part, i) => (
            <ToolResultRenderer
              key={i}
              toolName={getToolName(part as Parameters<typeof getToolName>[0])}
              output={(part as Record<string, unknown>).output}
              onConfirmRun={onConfirmRun}
              onConfirmAdjust={onConfirmAdjust}
            />
          ))}

        {/* Render tool errors */}
        {message.parts
          .filter(
            (part): part is Extract<typeof part, { state: string }> =>
              isToolUIPart(part) && part.state === "output-error"
          )
          .map((part, i) => {
            const err = (part as Record<string, unknown>).output;
            const message =
              err && typeof err === "object" && "message" in err
                ? String((err as { message: string }).message)
                : "Something went wrong while running this tool.";
            const code =
              err && typeof err === "object" && "errorCode" in err
                ? String((err as { errorCode: string }).errorCode)
                : undefined;
            return <ErrorCallout key={`err-${i}`} message={message} errorCode={code} />;
          })}

        {suggestions.length > 0 && onSuggestionSelect && (
          <SuggestionChips suggestions={suggestions} onSelect={onSuggestionSelect} />
        )}

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
