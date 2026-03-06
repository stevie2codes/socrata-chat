"use client";

import { useEffect } from "react";
import { X, SquarePen, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSummary } from "@/types";

interface ChatHistorySidebarProps {
  open: boolean;
  onClose: () => void;
  chats: ChatSummary[];
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onNewChat: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ChatHistorySidebar({
  open,
  onClose,
  chats,
  activeChatId,
  onSelectChat,
  onDeleteChat,
  onNewChat,
}: ChatHistorySidebarProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <aside
      aria-label="Chat history"
      className={cn(
        "fixed left-0 top-0 z-30 flex h-dvh w-[280px] flex-col glass-subtle transition-transform duration-200",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          History
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close history"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* New chat button */}
      <div className="border-b border-white/[0.06] px-3 py-2.5">
        <button
          onClick={onNewChat}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground/90 transition-colors hover:bg-white/[0.06]"
        >
          <SquarePen className="size-3.5" aria-hidden="true" />
          New chat
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <MessageSquare className="size-5 text-muted-foreground/40" aria-hidden="true" />
            <p className="text-xs text-muted-foreground/60">
              No past conversations
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5" role="list">
            {chats.map((chat) => {
              const isActive = chat.id === activeChatId;
              return (
                <li key={chat.id} className="group relative">
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors",
                      isActive
                        ? "bg-white/[0.08] text-foreground"
                        : "text-foreground/70 hover:bg-white/[0.04] hover:text-foreground"
                    )}
                  >
                    <span className="truncate text-xs font-medium leading-snug">
                      {chat.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatRelativeTime(chat.updatedAt)}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/40 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                    aria-label={`Delete "${chat.title}"`}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
