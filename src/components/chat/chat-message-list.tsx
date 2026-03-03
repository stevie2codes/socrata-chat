"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { UIMessage } from "ai";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/chat/chat-message";
import { StreamingIndicator } from "@/components/chat/streaming-indicator";
import type { QueryConfirmation } from "@/types";

interface ChatMessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  children?: ReactNode;
  onSuggestionSelect?: (suggestion: string) => void;
  onConfirmRun?: (confirmation: QueryConfirmation) => void;
  onConfirmAdjust?: () => void;
}

export function ChatMessageList({
  messages,
  isLoading,
  children,
  onSuggestionSelect,
  onConfirmRun,
  onConfirmAdjust,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return <>{children}</>;
  }

  return (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-5 px-4 py-8">
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const isStreamingMessage = isLast && isLoading && message.role === "assistant";

          if (isLast) {
            return (
              <div key={message.id} aria-live="polite">
                <ChatMessage
                  message={message}
                  isStreaming={isStreamingMessage}
                  isLast
                  onSuggestionSelect={onSuggestionSelect}
                  onConfirmRun={onConfirmRun}
                  onConfirmAdjust={onConfirmAdjust}
                />
              </div>
            );
          }

          return <ChatMessage key={message.id} message={message} onConfirmRun={onConfirmRun} onConfirmAdjust={onConfirmAdjust} />;
        })}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
          <StreamingIndicator />
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </ScrollArea>
  );
}
