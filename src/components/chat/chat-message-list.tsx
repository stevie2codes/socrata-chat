"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import type { UIMessage } from "ai";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const stuckRef = useRef(true);

  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  // Track whether the user has scrolled away from the bottom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      stuckRef.current = isNearBottom();
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isNearBottom]);

  // Auto-scroll only when stuck to bottom
  useEffect(() => {
    if (stuckRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, isLoading]);

  // Re-stick when user sends a new message
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === "user") {
      stuckRef.current = true;
    }
  }, [messages]);

  if (messages.length === 0) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-thin">
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
    </div>
  );
}
