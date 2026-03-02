"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { UIMessage } from "ai";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/chat/chat-message";
import { StreamingIndicator } from "@/components/chat/streaming-indicator";

interface ChatMessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  children?: ReactNode;
}

export function ChatMessageList({
  messages,
  isLoading,
  children,
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
      <div className="flex flex-col gap-4 px-4 py-6">
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const isStreamingMessage = isLast && isLoading && message.role === "assistant";

          if (isLast) {
            return (
              <div key={message.id} aria-live="polite">
                <ChatMessage message={message} isStreaming={isStreamingMessage} />
              </div>
            );
          }

          return <ChatMessage key={message.id} message={message} />;
        })}

        {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
          <StreamingIndicator />
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </ScrollArea>
  );
}
