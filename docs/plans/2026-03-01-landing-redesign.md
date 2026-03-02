# Landing Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebrand from "Socrata Chat" to "Open Data Reports" with a centered hero landing page, portal dropdown in the input bar, and portal-specific suggestion chips.

**Architecture:** Two-mode layout in `page.tsx` — when `messages.length === 0`, render a vertically centered hero (title + input + suggestions). After first message, switch to standard chat layout with a header bar. Portal state flows from page through session context. Suggestions are data-driven from `portals.ts`.

**Tech Stack:** Next.js App Router, shadcn/ui, Tailwind CSS v4, Vercel AI SDK v6

---

### Task 1: Add suggestions to portals data

**Files:**
- Modify: `src/lib/portals.ts`

**Step 1: Update Portal interface and data**

Add `suggestions: string[]` to the `Portal` interface and populate for all 8 portals:

```typescript
export interface Portal {
  domain: string;
  label: string;
  city: string;
  suggestions: string[];
}

export const PORTALS: Portal[] = [
  {
    domain: "data.cityofchicago.org",
    label: "Chicago",
    city: "Chicago",
    suggestions: [
      "Restaurant inspection failures",
      "Building permits this year",
      "Crime data by neighborhood",
    ],
  },
  {
    domain: "data.ny.gov",
    label: "New York State",
    city: "New York",
    suggestions: [
      "Health facility inspections",
      "School enrollment data",
      "Environmental permits",
    ],
  },
  {
    domain: "data.sfgov.org",
    label: "San Francisco",
    city: "San Francisco",
    suggestions: [
      "311 service requests",
      "Film location permits",
      "Business registrations",
    ],
  },
  {
    domain: "data.seattle.gov",
    label: "Seattle",
    city: "Seattle",
    suggestions: [
      "Building permits issued",
      "Public safety incidents",
      "Utility usage data",
    ],
  },
  {
    domain: "data.cityofnewyork.us",
    label: "New York City",
    city: "NYC",
    suggestions: [
      "311 complaints by borough",
      "Restaurant health grades",
      "Street tree census",
    ],
  },
  {
    domain: "data.lacounty.gov",
    label: "Los Angeles County",
    city: "LA County",
    suggestions: [
      "Property tax data",
      "Restaurant inspections",
      "COVID case data",
    ],
  },
  {
    domain: "data.austintexas.gov",
    label: "Austin",
    city: "Austin",
    suggestions: [
      "311 service requests",
      "Building permits",
      "Animal shelter outcomes",
    ],
  },
  {
    domain: "data.boston.gov",
    label: "Boston",
    city: "Boston",
    suggestions: [
      "311 service requests",
      "Building violations",
      "Crime incident reports",
    ],
  },
];
```

Keep `DEFAULT_PORTAL`, `findPortal`, and `getPortalLabel` unchanged.

**Step 2: Commit**

```bash
git add src/lib/portals.ts
git commit -m "feat: add portal-specific suggestions to portals data"
```

---

### Task 2: Update ChatInput with portal dropdown

**Files:**
- Modify: `src/components/chat/chat-input.tsx`

The input bar gets a native `<select>` on the left for portal selection. New props: `portal` (current domain string), `onPortalChange` (callback), `portals` (array). The placeholder adapts to the selected portal.

**Step 1: Rewrite ChatInput**

```tsx
"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Portal } from "@/lib/portals";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  portal: Portal;
  portals: Portal[];
  onPortalChange: (domain: string) => void;
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  textareaRef,
  portal,
  portals,
  onPortalChange,
}: ChatInputProps) {
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input, textareaRef]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <form onSubmit={onSubmit} aria-busy={isLoading}>
      <div className="bg-muted/50 border-border focus-within:ring-ring/20 flex items-end gap-0 rounded-2xl border transition-shadow focus-within:ring-2">
        <select
          value={portal.domain}
          onChange={(e) => onPortalChange(e.target.value)}
          aria-label="Select data portal"
          className="text-muted-foreground h-full min-h-[44px] shrink-0 cursor-pointer rounded-l-2xl bg-transparent py-2 pl-3 pr-1 text-sm outline-none"
        >
          {portals.map((p) => (
            <option key={p.domain} value={p.domain}>
              {p.label}
            </option>
          ))}
        </select>
        <div className="border-border/50 my-2 w-px shrink-0 self-stretch bg-current opacity-20" />
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          readOnly={isLoading}
          aria-label="Message input"
          placeholder={`Ask about ${portal.label} data...`}
          rows={1}
          className={cn(
            "max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-relaxed outline-none",
            "placeholder:text-muted-foreground/60",
            isLoading && "cursor-not-allowed opacity-60"
          )}
        />
        <Button
          type="submit"
          size="icon-sm"
          variant="default"
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          className="m-1.5 shrink-0 rounded-xl"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-4"
          >
            <path
              fillRule="evenodd"
              d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </div>
    </form>
  );
}
```

Key changes from original:
- Removed `border-t`, `px-4 py-3`, `sticky bottom-0` from form (page.tsx controls positioning now)
- Added portal `<select>` on the left with a divider
- Placeholder is dynamic: `Ask about ${portal.label} data...`
- New props: `portal`, `portals`, `onPortalChange`

**Step 2: Commit**

```bash
git add src/components/chat/chat-input.tsx
git commit -m "feat: add portal dropdown to chat input"
```

---

### Task 3: Make StarterPrompts portal-aware

**Files:**
- Modify: `src/components/chat/starter-prompts.tsx`

Remove the title/subtitle (that moves to `page.tsx`). Accept a `suggestions` array and render them as pill buttons. Keep the keyboard navigation.

**Step 1: Rewrite StarterPrompts**

```tsx
"use client";

import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";

interface StarterPromptsProps {
  suggestions: string[];
  onSelect: (prompt: string) => void;
}

export function StarterPrompts({ suggestions, onSelect }: StarterPromptsProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = buttonRefs.current.findIndex(
        (ref) => ref === document.activeElement
      );
      if (currentIndex === -1) return;

      let nextIndex: number | null = null;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        nextIndex = (currentIndex + 1) % suggestions.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        nextIndex =
          (currentIndex - 1 + suggestions.length) % suggestions.length;
      }

      if (nextIndex !== null) {
        buttonRefs.current[nextIndex]?.focus();
      }
    },
    [suggestions.length]
  );

  return (
    <div
      role="toolbar"
      aria-label="Suggested starting questions"
      className="flex flex-wrap justify-center gap-2"
      onKeyDown={handleKeyDown}
    >
      {suggestions.map((prompt, index) => (
        <Button
          key={prompt}
          ref={(el) => {
            buttonRefs.current[index] = el;
          }}
          variant="outline"
          className="h-auto rounded-full px-4 py-2 text-sm"
          tabIndex={index === 0 ? 0 : -1}
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
}
```

Key changes:
- Removed hardcoded `STARTER_PROMPTS` — now accepts `suggestions` prop
- Removed title/subtitle JSX
- Simplified wrapper: just the toolbar, no centering (page.tsx handles layout)
- Changed button styling to `rounded-full` pills

**Step 2: Commit**

```bash
git add src/components/chat/starter-prompts.tsx
git commit -m "feat: make starter prompts portal-aware"
```

---

### Task 4: Rewrite page.tsx with two-mode layout

**Files:**
- Modify: `src/app/page.tsx`

This is the main change. Two modes:
- **Hero mode** (`messages.length === 0`): centered title, input, and suggestions. No header.
- **Chat mode** (`messages.length > 0`): header bar + message list + bottom-pinned input.

Portal state is derived from session context.

**Step 1: Rewrite page.tsx**

```tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { StarterPrompts } from "@/components/chat/starter-prompts";
import { KeyboardHelpDialog } from "@/components/chat/keyboard-help-dialog";
import { createShortcutHandler } from "@/lib/keyboard-shortcuts";
import { PORTALS, DEFAULT_PORTAL, findPortal } from "@/lib/portals";
import { useSessionDispatch } from "@/lib/session/session-context";

const transport = new DefaultChatTransport({ api: "/api/chat" });

export default function Home() {
  const { messages, sendMessage, status } = useChat({ transport });
  const dispatch = useSessionDispatch();

  const [input, setInput] = useState("");
  const [portalDomain, setPortalDomain] = useState(DEFAULT_PORTAL.domain);
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
```

Key changes:
- Two render paths: `isHero` (centered) vs chat mode (header + messages + bottom input)
- Portal state managed locally + synced to session context
- No `<StarterPrompts>` passed as child to `ChatMessageList` — rendered directly in hero
- Chat mode header shows "Open Data Reports" + portal label
- Input positioning: hero mode = part of centered stack, chat mode = wrapped in sticky bottom container

**Step 2: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: two-mode layout with hero landing and chat mode"
```

---

### Task 5: Update metadata and system prompt

**Files:**
- Modify: `src/app/layout.tsx:17-21` (metadata)
- Modify: `src/app/api/chat/route.ts` (system prompt)

**Step 1: Update layout metadata**

Change title from "Socrata Chat" to "Open Data Reports". Update description.

```typescript
export const metadata: Metadata = {
  title: "Open Data Reports",
  description: "Explore public open data with natural language",
};
```

**Step 2: Update chat route system prompt to be portal-aware**

The route should accept `portal` from the request body and use it in the system prompt.

```typescript
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    portal = "data.cityofchicago.org",
  }: { messages: UIMessage[]; portal?: string } = await req.json();

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: `You are a friendly data exploration assistant for public open data portals. You are currently connected to the ${portal} Socrata portal.

You help users discover and query public datasets using natural language.

For now, respond conversationally. In future updates, you'll have access to tools for searching and querying Socrata datasets directly.

Keep responses concise and helpful. When users ask about data, describe what kinds of datasets might be available and how you'll be able to help them explore it.`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

**Step 3: Pass portal from client to API**

In `page.tsx`, the `useChat` transport needs to include the portal. Update the transport to send `body` with portal:

This requires changing how we create the transport. Instead of a module-level constant, create it inside the component or use `useChat`'s `body` option.

Check if `useChat` in AI SDK v6 supports a `body` option — if so, use that. If not, we'll need a custom transport.

Looking at the AI SDK v6 API: `useChat` accepts `body` which gets merged into the POST request body. So:

```tsx
const { messages, sendMessage, status } = useChat({
  transport,
  body: { portal: portalDomain },
});
```

This is a one-line change in `page.tsx` — add `body: { portal: portalDomain }` to the `useChat` call.

**Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/api/chat/route.ts src/app/page.tsx
git commit -m "feat: portal-aware system prompt and updated metadata"
```

---

### Task 6: Visual verification and polish

**Step 1: Start dev server**

```bash
cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat
npm run dev
```

**Step 2: Verify hero mode**

- Page loads with centered "Open Data Reports" title
- Input bar has portal dropdown (Chicago default) and text area
- 3 suggestion chips below input
- Changing portal dropdown updates suggestions and placeholder

**Step 3: Verify chat mode transition**

- Click a suggestion or type a message
- Layout transitions: header appears, input moves to bottom, messages fill middle
- Header shows "Open Data Reports" on left, portal label on right

**Step 4: Verify portal switch**

- Change portal in dropdown, suggestions update
- Send a message, verify system prompt mentions the correct portal

**Step 5: Fix any visual issues**

Adjust spacing, alignment, colors as needed. The hero should feel clean and balanced.

**Step 6: Commit any polish**

```bash
git add -A
git commit -m "fix: visual polish for landing redesign"
```

---

### Task 7: Commit uncommitted prior changes

**Note:** There are already uncommitted changes from the previous session (`next.config.ts`, `session-context.tsx`, `portals.ts`, `README.md`). These should be committed first, before starting Task 1, since Task 1 modifies `portals.ts`.

**Step 1: Commit existing changes**

```bash
git add next.config.ts src/lib/session/session-context.tsx src/lib/portals.ts README.md
git commit -m "feat: add multi-portal support and dev config"
```

---

## Execution Order

1. **Task 7** (commit existing changes — must go first)
2. **Task 1** (portals data)
3. **Task 2** (chat input)
4. **Task 3** (starter prompts)
5. **Task 4** (page.tsx — depends on tasks 2 and 3)
6. **Task 5** (metadata + route + body param)
7. **Task 6** (visual verification)
