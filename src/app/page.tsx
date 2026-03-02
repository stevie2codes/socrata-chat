"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { StarterPrompts } from "@/components/chat/starter-prompts";
import { KeyboardHelpDialog } from "@/components/chat/keyboard-help-dialog";
import { createShortcutHandler } from "@/lib/keyboard-shortcuts";

const transport = new DefaultChatTransport({ api: "/api/chat" });

export default function Home() {
  const { messages, sendMessage, status } = useChat({ transport });

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        sendMessage({ text: input });
        setInput("");
      }
    },
    [input, isLoading, sendMessage]
  );

  const handleStarterSelect = useCallback(
    (prompt: string) => {
      sendMessage({ text: prompt });
    },
    [sendMessage]
  );

  // Register keyboard shortcuts
  useEffect(() => {
    const shortcuts = new Map<string, () => void>();

    shortcuts.set("focus-input", () => inputRef.current?.focus());
    shortcuts.set("focus-input-alt", () => inputRef.current?.focus());
    shortcuts.set("show-help", () => setShowHelp(true));
    shortcuts.set("escape", () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
    // toggle-sidebar and export-results will be wired in later phases

    const handler = createShortcutHandler(shortcuts);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-border/50 flex shrink-0 items-center justify-between border-b px-4 py-3">
        <h1 className="text-sm font-semibold">Socrata Chat</h1>
        <span className="text-muted-foreground text-xs">
          data.cityofchicago.org
        </span>
      </header>

      <main id="main-content" role="main" className="flex min-h-0 flex-1">
        <div className="flex flex-1 flex-col">
          <ChatMessageList messages={messages} isLoading={isLoading}>
            <StarterPrompts onSelect={handleStarterSelect} />
          </ChatMessageList>

          <ChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            textareaRef={inputRef}
          />
        </div>
      </main>

      <KeyboardHelpDialog open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
