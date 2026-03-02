"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { StarterPrompts } from "@/components/chat/starter-prompts";
import { KeyboardHelpDialog } from "@/components/chat/keyboard-help-dialog";
import { createShortcutHandler } from "@/lib/keyboard-shortcuts";
import { PORTALS, DEFAULT_PORTAL, findPortal } from "@/lib/portals";
import { useSessionDispatch } from "@/lib/session/session-context";

export default function Home() {
  const [input, setInput] = useState("");
  const [portalDomain, setPortalDomain] = useState(DEFAULT_PORTAL.domain);
  const portalDomainRef = useRef(portalDomain);
  portalDomainRef.current = portalDomain;

  const transportRef = useRef<DefaultChatTransport<UIMessage> | null>(null);
  if (!transportRef.current) {
    transportRef.current = new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({ portal: portalDomainRef.current }),
    });
  }

  const { messages, sendMessage, status } = useChat({
    transport: transportRef.current,
  });
  const dispatch = useSessionDispatch();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const portal = findPortal(portalDomain) ?? DEFAULT_PORTAL;
  const isLoading = status === "streaming" || status === "submitted";
  const isHero = messages.length === 0;

  const handlePortalChange = useCallback(
    (domain: string) => {
      setPortalDomain(domain);
      dispatch({ type: "SET_PORTAL", payload: domain });
    },
    [dispatch]
  );

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
    const handler = createShortcutHandler(shortcuts);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (isHero) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              Open Data Reports
            </h1>
            <p className="text-muted-foreground text-sm">
              Explore public data with natural language
            </p>
          </div>

          <div className="w-full">
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              textareaRef={inputRef}
              portal={portal}
              portals={PORTALS}
              onPortalChange={handlePortalChange}
            />
          </div>

          <StarterPrompts
            suggestions={portal.suggestions}
            onSelect={handleStarterSelect}
          />
        </div>

        <KeyboardHelpDialog open={showHelp} onOpenChange={setShowHelp} />
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="border-border/50 flex shrink-0 items-center justify-between border-b px-4 py-3">
        <h1 className="text-sm font-semibold">Open Data Reports</h1>
        <span className="text-muted-foreground text-xs">{portal.label}</span>
      </header>

      <main id="main-content" role="main" className="flex min-h-0 flex-1">
        <div className="flex flex-1 flex-col">
          <ChatMessageList messages={messages} isLoading={isLoading} />

          <div className="border-border/50 bg-background sticky bottom-0 border-t px-4 py-3">
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              textareaRef={inputRef}
              portal={portal}
              portals={PORTALS}
              onPortalChange={handlePortalChange}
            />
          </div>
        </div>
      </main>

      <KeyboardHelpDialog open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
