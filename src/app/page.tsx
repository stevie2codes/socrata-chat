"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage, isToolUIPart, getToolName } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { SquarePen, PanelRight } from "lucide-react";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { StarterPrompts } from "@/components/chat/starter-prompts";
import { KeyboardHelpDialog } from "@/components/chat/keyboard-help-dialog";
import { ContextSidebar } from "@/components/sidebar/context-sidebar";
import { createShortcutHandler } from "@/lib/keyboard-shortcuts";
import { downloadCsv } from "@/lib/utils/csv-export";
import { PORTALS, DEFAULT_PORTAL, findPortal } from "@/lib/portals";
import { useSession, useSessionDispatch } from "@/lib/session/session-context";
import { useSessionSync } from "@/lib/session/use-session-sync";

export default function Home() {
  const [input, setInput] = useState("");
  const [portalDomain, setPortalDomain] = useState(DEFAULT_PORTAL.domain);
  const portalDomainRef = useRef(portalDomain);
  portalDomainRef.current = portalDomain;

  const session = useSession();
  const dispatch = useSessionDispatch();
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const transportRef = useRef<DefaultChatTransport<UIMessage> | null>(null);
  if (!transportRef.current) {
    transportRef.current = new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        portal: portalDomainRef.current,
        activeDataset: sessionRef.current.activeDataset,
        filters: sessionRef.current.filters,
      }),
    });
  }

  const { messages, setMessages, sendMessage, status } = useChat({
    transport: transportRef.current,
  });

  useSessionSync(messages, dispatch, portalDomain);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      sendMessage({ text: suggestion });
    },
    [sendMessage]
  );

  const handleNewChat = useCallback(() => {
    setMessages([]);
    dispatch({ type: "RESET" });
    setSidebarOpen(false);
  }, [setMessages, dispatch]);

  useEffect(() => {
    const shortcuts = new Map<string, () => void>();
    shortcuts.set("focus-input", () => inputRef.current?.focus());
    shortcuts.set("focus-input-alt", () => inputRef.current?.focus());
    shortcuts.set("show-help", () => setShowHelp(true));
    shortcuts.set("toggle-sidebar", () => setSidebarOpen((prev) => !prev));
    shortcuts.set("export-results", () => {
      for (let i = messagesRef.current.length - 1; i >= 0; i--) {
        const msg = messagesRef.current[i];
        if (msg.role !== "assistant") continue;
        for (const part of msg.parts) {
          if (
            isToolUIPart(part) &&
            part.state === "output-available" &&
            getToolName(part) === "query_dataset"
          ) {
            const output = (part as Record<string, unknown>).output;
            if (output && typeof output === "object" && "data" in output) {
              const data = (output as { data: Record<string, unknown>[] }).data;
              if (data.length > 0) downloadCsv(data);
            }
            return;
          }
        }
      }
    });
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
      <div className="relative z-10 flex h-dvh flex-col items-center justify-center px-4">
        <div
          className="flex w-full max-w-[720px] flex-col items-center gap-10"
          style={{ animation: "fade-in-up 0.8s ease-out both" }}
        >
          {/* Hero title */}
          <div className="relative flex flex-col items-center gap-4 text-center">
            <h1 className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-[2.5rem] font-bold tracking-tight text-transparent">
              Pulse
            </h1>
            <p className="max-w-sm text-[15px] font-light leading-relaxed text-muted-foreground">
              Your city&apos;s open data, one question away
            </p>
          </div>

          {/* Glass chat panel — the hero centerpiece */}
          <div className="hero-input-panel glass-strong w-full rounded-3xl p-1.5">
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              textareaRef={inputRef}
              portal={portal}
              portals={PORTALS}
              onPortalChange={handlePortalChange}
              variant="hero"
            />
          </div>

          {/* Starter prompts */}
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
    <div className="relative z-10 flex h-dvh flex-col">
      {/* Sticky header */}
      <header className="glass-subtle sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleNewChat}
            aria-label="New chat"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            <SquarePen className="size-4" />
          </button>
          <h1 className="text-sm font-semibold tracking-tight text-foreground/90">
            Pulse
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="glass-pill rounded-full px-3 py-1 text-xs font-medium text-muted-foreground">
            {portal.label}
          </span>
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle context panel"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            <PanelRight className="size-4" />
          </button>
        </div>
      </header>

      <main
        id="main-content"
        role="main"
        className="flex min-h-0 flex-1 flex-col transition-[padding] duration-200"
        style={{ paddingRight: sidebarOpen ? 280 : 0 }}
      >
        <div className="mx-auto flex w-full min-h-0 max-w-[720px] flex-1 flex-col pb-32">
          <ChatMessageList messages={messages} isLoading={isLoading} onSuggestionSelect={handleSuggestionSelect} />
        </div>
      </main>

      {/* Floating bottom dock */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20"
        style={{ paddingRight: sidebarOpen ? 280 : 0 }}
      >
        {/* Fade-out gradient — content dissolves into the dock */}
        <div className="h-10 bg-gradient-to-b from-transparent to-background/80" />
        {/* Dock surface */}
        <div className="bg-background/80 pb-[env(safe-area-inset-bottom)]">
          <div className="pointer-events-auto mx-auto w-full max-w-[720px] px-4 pb-4 pt-1">
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
      </div>

      <ContextSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        session={session}
        onRemoveFilter={(index) =>
          dispatch({ type: "REMOVE_FILTER", payload: index })
        }
      />

      <KeyboardHelpDialog open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
