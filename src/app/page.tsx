"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  type UIMessage,
  isToolUIPart,
  getToolName,
} from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { SquarePen, PanelRight, PanelLeft } from "lucide-react";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatErrorBoundary } from "@/components/chat/error-boundary";
import { ChatInput } from "@/components/chat/chat-input";
import { ErrorCallout } from "@/components/data/error-callout";
import { StarterPrompts } from "@/components/chat/starter-prompts";
import { KeyboardHelpDialog } from "@/components/chat/keyboard-help-dialog";
import { ContextSidebar } from "@/components/sidebar/context-sidebar";
import { ChatHistorySidebar } from "@/components/sidebar/chat-history-sidebar";
import { listChats, saveChat, loadChat, deleteChat, generateTitle } from "@/lib/chat-store";
import { createShortcutHandler } from "@/lib/keyboard-shortcuts";
import { downloadCsv } from "@/lib/utils/csv-export";
import { PORTALS, DEFAULT_PORTAL, findPortal } from "@/lib/portals";
import { useSession, useSessionDispatch } from "@/lib/session/session-context";
import { useSessionSync } from "@/lib/session/use-session-sync";
import { composeFilterMessage } from "@/lib/filter-diff";
import type { QueryFilter } from "@/types";

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

  // Track when we've just provided a client-side tool output so
  // sendAutomaticallyWhen only fires once per confirmation action.
  const pendingConfirmRef = useRef(false);

  const { messages, setMessages, sendMessage, stop, addToolOutput, status, error, clearError } = useChat({
    transport: transportRef.current,
    experimental_throttle: 50,
    sendAutomaticallyWhen: () => {
      if (pendingConfirmRef.current) {
        pendingConfirmRef.current = false;
        return true;
      }
      return false;
    },
    onToolCall: ({ toolCall }) => {
      // confirm_query is a client-side tool — the UI renders the
      // QueryConfirmationCard and calls addToolOutput when the user acts.
      // Other tools execute server-side and don't hit this callback.
    },
    onError: (err) => {
      console.error("[chat] Stream error:", err);
    },
    onFinish: ({ message, messages: allMessages, isAbort, isError }) => {
      if (isAbort) return;
      if (isError) {
        console.error("[chat] Response ended with error");
        return;
      }
      console.log("[chat] Response complete", {
        messageId: message.id,
        totalMessages: allMessages.length,
      });
    },
  });

  useSessionSync(messages, dispatch, portalDomain);

  // Auto-save chat to localStorage (debounced)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (messages.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const title = generateTitle(messages as Parameters<typeof generateTitle>[0]);
      saveChat(session.conversationId, title, session.portal, messages, session);
      setChatList(listChats());
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [messages, session]);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatList, setChatList] = useState(() =>
    typeof window !== "undefined" ? listChats() : []
  );

  const portal = findPortal(portalDomain) ?? DEFAULT_PORTAL;
  const isLoading = status === "streaming" || status === "submitted";
  const isHero = messages.length === 0;

  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  const stopRef = useRef(stop);
  stopRef.current = stop;

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
        if (error) clearError();
        sendMessage({ text: input });
        setInput("");
      }
    },
    [input, isLoading, sendMessage, error, clearError]
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

  const handleConfirmRun = useCallback(
    ({
      toolCallId,
      filters,
    }: {
      toolCallId: string;
      filters: { original: QueryFilter[]; current: QueryFilter[] };
    }) => {
      const filterMessage = composeFilterMessage(filters.original, filters.current);
      pendingConfirmRef.current = true;
      addToolOutput({
        tool: "confirm_query",
        toolCallId,
        output: {
          decision: "run",
          filterChanges: filterMessage,
          currentFilters: filters.current,
        },
      });
      // sendAutomaticallyWhen detects the completed tool call and
      // auto-sends the conversation so Claude proceeds to query_dataset
    },
    [addToolOutput]
  );

  const handleConfirmAdjust = useCallback(
    ({ toolCallId }: { toolCallId: string }) => {
      pendingConfirmRef.current = true;
      addToolOutput({
        tool: "confirm_query",
        toolCallId,
        output: {
          decision: "adjust",
          userMessage: "User wants to adjust the query",
        },
      });
      setInput("Actually, I'd like to change ");
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [addToolOutput]
  );

  const handleRetryLastMessage = useCallback(() => {
    const lastUserMsg = [...messagesRef.current]
      .reverse()
      .find((m) => m.role === "user");
    const lastText =
      lastUserMsg?.parts
        .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
        .map((p) => p.text)
        .join("") ?? "";

    clearError();
    if (lastText.trim()) {
      // Remove incomplete assistant message so we don't send partial state to model
      const msgs = messagesRef.current;
      if (msgs.at(-1)?.role === "assistant") {
        setMessages(msgs.slice(0, -1));
      }
      sendMessage({ text: lastText });
    }
  }, [clearError, sendMessage, setMessages]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    dispatch({ type: "RESET" });
    setSidebarOpen(false);
    setChatList(listChats());
  }, [setMessages, dispatch]);

  const handleLoadChat = useCallback(
    (id: string) => {
      if (id === session.conversationId) return;
      const data = loadChat(id);
      if (!data) return;
      setMessages(data.messages as Parameters<typeof setMessages>[0]);
      dispatch({ type: "RESTORE", payload: data.session });
      setPortalDomain(data.session.portal);
    },
    [session.conversationId, setMessages, dispatch]
  );

  const handleDeleteChat = useCallback(
    (id: string) => {
      deleteChat(id);
      setChatList(listChats());
      // If deleting the active chat, start fresh
      if (id === session.conversationId) {
        setMessages([]);
        dispatch({ type: "RESET" });
      }
    },
    [session.conversationId, setMessages, dispatch]
  );

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
    shortcuts.set("toggle-history", () => setHistoryOpen((prev) => !prev));
    shortcuts.set("escape", () => {
      if (isLoadingRef.current) {
        stopRef.current();
      } else if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });
    const handler = createShortcutHandler(shortcuts);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  if (isHero) {
    return (
      <div id="main-content" className="relative z-10 flex h-dvh flex-col items-center justify-center px-4">
        {/* History toggle — top-left corner */}
        {chatList.length > 0 && (
          <button
            onClick={() => setHistoryOpen((prev) => !prev)}
            aria-label="Toggle chat history"
            className="fixed left-4 top-4 z-20 flex size-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            <PanelLeft className="size-4" />
          </button>
        )}
        <ChatHistorySidebar
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          chats={chatList}
          activeChatId={session.conversationId}
          onSelectChat={handleLoadChat}
          onDeleteChat={handleDeleteChat}
          onNewChat={handleNewChat}
        />
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
              onStop={stop}
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
            onClick={() => setHistoryOpen((prev) => !prev)}
            aria-label="Toggle chat history"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground"
          >
            <PanelLeft className="size-4" />
          </button>
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
        inert={historyOpen || sidebarOpen ? true : undefined}
        className="flex min-h-0 flex-1 flex-col transition-[padding] duration-200"
        style={{
          paddingRight: sidebarOpen ? 280 : 0,
          paddingLeft: historyOpen ? 280 : 0,
        }}
      >
        <div className="mx-auto flex w-full min-h-0 max-w-[960px] flex-1 flex-col pb-32">
          <ChatErrorBoundary>
            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              onSuggestionSelect={handleSuggestionSelect}
              onConfirmRun={handleConfirmRun}
              onConfirmAdjust={handleConfirmAdjust}
            />
          </ChatErrorBoundary>
        </div>
      </main>

      {/* Floating bottom dock */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20"
        inert={historyOpen || sidebarOpen ? true : undefined}
        style={{
          paddingRight: sidebarOpen ? 280 : 0,
          paddingLeft: historyOpen ? 280 : 0,
        }}
      >
        {/* Fade-out gradient — content dissolves into the dock */}
        <div className="h-10 bg-gradient-to-b from-transparent to-background/80" />
        {/* Dock surface */}
        <div className="bg-background/80 pb-[env(safe-area-inset-bottom)]">
          <div className="pointer-events-auto mx-auto w-full max-w-[720px] px-4 pb-4 pt-1">
            {error && (
              <ErrorCallout
                message={error.message || "Something went wrong. Please try again."}
                onRetry={handleRetryLastMessage}
                retryLabel="Retry"
              />
            )}
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onStop={stop}
              textareaRef={inputRef}
              portal={portal}
              portals={PORTALS}
              onPortalChange={handlePortalChange}
            />
          </div>
        </div>
      </div>

      <ChatHistorySidebar
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        chats={chatList}
        activeChatId={session.conversationId}
        onSelectChat={handleLoadChat}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
      />

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
