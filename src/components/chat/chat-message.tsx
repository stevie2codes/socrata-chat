"use client";

import type { UIMessage } from "ai";
import { isToolUIPart, getToolName } from "ai";
import { cn } from "@/lib/utils";
import { parseSuggestions, getHeuristicSuggestions } from "@/lib/suggestions";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { ToolResultRenderer } from "@/components/chat/tool-result-renderer";
import { ThinkingBlock } from "@/components/chat/thinking-block";
import { ErrorCallout } from "@/components/data/error-callout";
import { SuggestionChips } from "@/components/chat/suggestion-chips";
import { StreamingPhaseIndicator } from "@/components/chat/streaming-phases";
import { DatasetCardSkeleton, DataTableSkeleton } from "@/components/data/loading-skeleton";
import type { QueryFilter } from "@/types";

function ToolLoadingSkeleton({ toolName }: { toolName: string }) {
  if (toolName === "search_datasets") {
    return (
      <div className="space-y-2">
        <DatasetCardSkeleton />
        <DatasetCardSkeleton />
        <DatasetCardSkeleton />
      </div>
    );
  }
  if (toolName === "query_dataset") {
    return <DataTableSkeleton />;
  }
  return null;
}

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
  isLast?: boolean;
  onSuggestionSelect?: (suggestion: string) => void;
  onConfirmRun?: (args: { toolCallId: string; filters: { original: QueryFilter[]; current: QueryFilter[] } }) => void;
  onConfirmAdjust?: (args: { toolCallId: string }) => void;
}

function extractMessageText(parts: UIMessage["parts"]): {
  thinkingText: string;
  responseText: string;
} {
  const COMPLETED = new Set(["output-available", "output-error", "output-denied"]);
  const hasAnyTool = parts.some((p) => isToolUIPart(p));

  // No tools called — all text is the response (plain conversation)
  if (!hasAnyTool) {
    return {
      thinkingText: "",
      responseText: parts.filter((p) => p.type === "text").map((p) => p.text).join("\n\n"),
    };
  }

  // Find the boundary: text after the last completed tool = response,
  // everything else that's interleaved with tools = thinking.
  let lastCompletedToolIndex = -1;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (isToolUIPart(parts[i]) && COMPLETED.has((parts[i] as any).state)) {
      lastCompletedToolIndex = i;
      break;
    }
  }

  // Tools exist but none completed yet — all pre-tool text is thinking
  if (lastCompletedToolIndex === -1) {
    const thinkingParts: string[] = [];
    for (const part of parts) {
      if (isToolUIPart(part)) break;
      if (part.type === "text" && part.text.trim()) thinkingParts.push(part.text);
    }
    return { thinkingText: thinkingParts.join("\n\n"), responseText: "" };
  }

  // Thinking = all text parts up to and including the last completed tool's position
  // (this captures pre-tool text AND inter-tool reasoning like "Now let me query...")
  const thinkingParts: string[] = [];
  for (const p of parts.slice(0, lastCompletedToolIndex + 1)) {
    if (p.type === "text" && p.text.trim()) thinkingParts.push(p.text);
  }

  // Response = text after the last completed tool
  const responseText = parts
    .slice(lastCompletedToolIndex + 1)
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n\n");

  return { thinkingText: thinkingParts.join("\n\n"), responseText };
}

export function ChatMessage({ message, isStreaming = false, isLast = false, onSuggestionSelect, onConfirmRun, onConfirmAdjust }: ChatMessageProps) {
  const isUser = message.role === "user";

  const { thinkingText, responseText } = extractMessageText(message.parts);
  const { cleanText: textContent, suggestions: parsedSuggestions } = parseSuggestions(responseText);

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
      <article role="article" aria-label={ariaLabel} className="mx-auto flex w-full max-w-[720px] justify-end">
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
      <div className="w-full text-sm leading-[1.7]">
        {/* Thinking block — reasoning text before tool calls */}
        {thinkingText.trim() && (
          <ThinkingBlock text={thinkingText} isStreaming={isStreaming && !hasText} />
        )}

        {/* Render tool results FIRST — data is the star, text is supporting.
            Tool results (DataTable) get full container width (up to 960px). */}
        {message.parts
          .filter(
            (part): part is Extract<typeof part, { state: string }> => {
              if (!isToolUIPart(part)) return false;
              // Client-side tools (confirm_query) render when input is available
              if (getToolName(part) === "confirm_query" && part.state === "input-available") return true;
              // All other tools render when output is available
              return part.state === "output-available";
            }
          )
          .map((part, i) => {
            const toolName = getToolName(part as Parameters<typeof getToolName>[0]);
            const typedPart = part as Record<string, unknown>;
            // For client-side tools awaiting input, use the tool's input args as the display data
            const output = typedPart.state === "input-available" ? typedPart.input : typedPart.output;
            return (
              <ToolResultRenderer
                key={i}
                toolName={toolName}
                toolCallId={typedPart.toolCallId as string}
                output={output}
                input={typedPart.input}
                isLast={isLast}
                onConfirmRun={onConfirmRun}
                onConfirmAdjust={onConfirmAdjust}
              />
            );
          })}

        {/* Loading skeleton while tool is in-flight */}
        {isStreaming && activeToolName && (
          <ToolLoadingSkeleton toolName={activeToolName} />
        )}

        {/* Text and non-data content stay at readable 720px max */}
        <div className="max-w-[720px]">
          {hasText && <MarkdownContent content={textContent} />}

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

          {isStreaming && (activeToolName || isOnlyTools) && (
            <StreamingPhaseIndicator
              activeToolName={activeToolName}
              isOnlyTools={isOnlyTools}
            />
          )}
        </div>
      </div>
    </article>
  );
}
