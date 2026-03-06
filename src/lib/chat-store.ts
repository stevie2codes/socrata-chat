import type { ChatSummary, SessionState } from "@/types";

const CHATS_KEY = "pulse:chats";
const chatMessagesKey = (id: string) => `pulse:chat:${id}:messages`;
const chatSessionKey = (id: string) => `pulse:chat:${id}:session`;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

export function listChats(): ChatSummary[] {
  return readJson<ChatSummary[]>(CHATS_KEY, []);
}

export function saveChat(
  id: string,
  title: string,
  portal: string,
  messages: unknown[],
  session: SessionState
): void {
  const chats = listChats();
  const now = Date.now();
  const existing = chats.find((c) => c.id === id);

  if (existing) {
    existing.title = title;
    existing.portal = portal;
    existing.updatedAt = now;
  } else {
    chats.unshift({ id, title, portal, createdAt: now, updatedAt: now });
  }

  // Keep most recent first
  chats.sort((a, b) => b.updatedAt - a.updatedAt);

  writeJson(CHATS_KEY, chats);
  writeJson(chatMessagesKey(id), messages);
  writeJson(chatSessionKey(id), session);
}

export function loadChat(
  id: string
): { messages: unknown[]; session: SessionState } | null {
  const messages = readJson<unknown[] | null>(chatMessagesKey(id), null);
  const session = readJson<SessionState | null>(chatSessionKey(id), null);
  if (!messages || !session) return null;
  return { messages, session };
}

export function deleteChat(id: string): void {
  const chats = listChats().filter((c) => c.id !== id);
  writeJson(CHATS_KEY, chats);
  try {
    localStorage.removeItem(chatMessagesKey(id));
    localStorage.removeItem(chatSessionKey(id));
  } catch {
    // Ignore
  }
}

/** Generate a title from the first user message, truncated to ~60 chars. */
export function generateTitle(
  messages: Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>
): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New conversation";

  // Vercel AI SDK v6: text lives in parts[].text
  let text = "";
  if (first.parts) {
    const textPart = first.parts.find((p) => p.type === "text");
    if (textPart?.text) text = textPart.text;
  }
  if (!text && first.content) text = first.content;
  if (!text) return "New conversation";

  return text.length > 60 ? text.slice(0, 57) + "..." : text;
}
