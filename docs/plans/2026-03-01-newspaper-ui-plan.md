# "The Newspaper" UI Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the chat UI from plain text into an editorial-minimal interface with markdown rendering, data color palette, collapsible tables, and polished streaming states.

**Architecture:** Modify existing components in-place. Add `react-markdown` + `remark-gfm` for content rendering. Introduce 4 data CSS tokens. Replace the streaming indicator with a tool-aware shimmer bar. No new pages or routes.

**Tech Stack:** react-markdown, remark-gfm, Tailwind CSS v4 custom properties, existing shadcn/ui primitives

---

### Task 1: Install react-markdown and remark-gfm

**Files:**
- Modify: `package.json`

**Step 1: Install dependencies**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npm install react-markdown remark-gfm`

Expected: packages added to dependencies in package.json

**Step 2: Verify install**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && node -e "require('react-markdown'); require('remark-gfm'); console.log('OK')"`

Expected: `OK`

**Step 3: Commit**

```bash
cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat
git add package.json package-lock.json
git commit -m "chore: add react-markdown and remark-gfm"
```

---

### Task 2: Add data color palette to CSS tokens

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add data color tokens to both `:root` and `.dark` blocks, and map them in `@theme inline`**

Add to `@theme inline` block (after the chart-* lines):

```css
--color-data-1: var(--data-1);
--color-data-2: var(--data-2);
--color-data-3: var(--data-3);
--color-data-4: var(--data-4);
```

Add to `:root` block (after the chart lines):

```css
--data-1: oklch(0.55 0.12 250);
--data-2: oklch(0.65 0.14 65);
--data-3: oklch(0.60 0.10 155);
--data-4: oklch(0.58 0.16 25);
```

Add to `.dark` block (after the chart lines):

```css
--data-1: oklch(0.65 0.14 250);
--data-2: oklch(0.72 0.14 65);
--data-3: oklch(0.68 0.12 155);
--data-4: oklch(0.65 0.16 25);
```

**Step 2: Update primary color to use data-1 (muted blue)**

In `:root`, change:
```css
--primary: oklch(0.55 0.12 250);
--ring: oklch(0.55 0.12 250);
```

In `.dark`, change:
```css
--primary: oklch(0.65 0.14 250);
--ring: oklch(0.65 0.14 250);
```

**Step 3: Add shimmer keyframe animation**

After the existing `pulse-dot` keyframe, add:

```css
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
```

**Step 4: Verify dev server still compiles**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npm run build 2>&1 | tail -5`

Expected: Build succeeds (or dev server shows no CSS errors)

**Step 5: Commit**

```bash
cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat
git add src/app/globals.css
git commit -m "style: add data color palette and shimmer animation"
```

---

### Task 3: Create markdown renderer component

**Files:**
- Create: `src/components/chat/markdown-content.tsx`

**Step 1: Create the markdown renderer**

This component wraps `react-markdown` with remark-gfm and provides editorial-styled custom renderers for headings, paragraphs, code, lists, and tables. Tables are wrapped in a collapsible disclosure widget.

```tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, type ComponentPropsWithoutRef } from "react";

interface MarkdownContentProps {
  content: string;
}

function CollapsibleTable({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-data-1/30 my-4 border-l-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-muted-foreground hover:text-foreground flex items-center gap-2 px-3 py-2 text-xs transition-colors"
      >
        <svg
          className={`size-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {open ? "Hide data" : "Show data"}
      </button>
      {open && <div className="overflow-x-auto px-3 pb-3">{children}</div>}
    </div>
  );
}

const components = {
  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-6 mb-2 text-base font-semibold tracking-tight" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mt-5 mb-2 text-sm font-semibold" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className="mt-3 first:mt-0" {...props}>
      {children}
    </p>
  ),
  strong: ({ children, ...props }: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  code: ({ children, className, ...props }: ComponentPropsWithoutRef<"code">) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className={`${className} bg-muted block overflow-x-auto rounded-md p-3 font-mono text-xs`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs" {...props}>
        {children}
      </code>
    );
  },
  ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-2 list-disc space-y-1 pl-5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol className="mt-2 list-decimal space-y-1 pl-5" {...props}>
      {children}
    </ol>
  ),
  table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
    <CollapsibleTable>
      <table className="w-full text-xs" {...props}>
        {children}
      </table>
    </CollapsibleTable>
  ),
  thead: ({ children, ...props }: ComponentPropsWithoutRef<"thead">) => (
    <thead className="bg-data-1/5 border-b" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th className="px-3 py-2 text-left font-medium whitespace-nowrap" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td className="border-border/50 border-t px-3 py-2 font-mono whitespace-nowrap" {...props}>
      {children}
    </td>
  ),
};

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
```

**Step 2: Verify it compiles**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors related to markdown-content.tsx

**Step 3: Commit**

```bash
cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat
git add src/components/chat/markdown-content.tsx
git commit -m "feat: add markdown renderer with collapsible tables"
```

---

### Task 4: Redesign chat-message to use markdown + hide tool narration

**Files:**
- Modify: `src/components/chat/chat-message.tsx`

**Step 1: Rewrite chat-message.tsx**

Replace the full file contents with:

```tsx
"use client";

import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { MarkdownContent } from "@/components/chat/markdown-content";

interface ChatMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
}

const TOOL_LABELS: Record<string, string> = {
  search_datasets: "Searching datasets",
  get_dataset_info: "Reading dataset schema",
  query_dataset: "Querying data",
};

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Collect all text parts into one string for markdown rendering
  const textContent = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");

  // Find the latest active tool invocation (for streaming status)
  const activeToolPart = isStreaming
    ? [...message.parts]
        .reverse()
        .find(
          (part) =>
            part.type === "tool-invocation" && part.toolInvocation.state !== "result"
        )
    : null;

  const activeToolName =
    activeToolPart?.type === "tool-invocation"
      ? activeToolPart.toolInvocation.toolName
      : null;

  // Check if we have any completed text to show
  const hasText = textContent.trim().length > 0;

  // Check if all parts are tool invocations (no final text yet)
  const isOnlyTools =
    !hasText &&
    message.parts.every(
      (part) => part.type === "tool-invocation" || (part.type === "text" && !part.text.trim())
    );

  const ariaLabel = isUser
    ? `You said: ${textContent.slice(0, 100)}`
    : "Assistant response";

  if (isUser) {
    return (
      <article role="article" aria-label={ariaLabel} className="flex w-full justify-end">
        <div className="bg-primary/10 max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed">
          <p className="whitespace-pre-wrap">{textContent}</p>
        </div>
      </article>
    );
  }

  return (
    <article role="article" aria-label={ariaLabel} className="flex w-full justify-start">
      <div className="max-w-full text-sm leading-[1.7]">
        {hasText && <MarkdownContent content={textContent} />}

        {isStreaming && hasText && (
          <span className="bg-data-1 ml-0.5 inline-block h-4 w-0.5 animate-pulse align-middle" />
        )}

        {isStreaming && activeToolName && (
          <div className="mt-3 flex items-center gap-3">
            <div className="bg-muted relative h-0.5 w-32 overflow-hidden rounded-full">
              <div className="bg-data-1/60 absolute inset-0 animate-[shimmer_1.5s_ease-in-out_infinite]" />
            </div>
            <span className="text-muted-foreground text-xs">
              {TOOL_LABELS[activeToolName] ?? "Working"}...
            </span>
          </div>
        )}

        {isStreaming && isOnlyTools && activeToolName && (
          <div className="flex items-center gap-3">
            <div className="bg-muted relative h-0.5 w-32 overflow-hidden rounded-full">
              <div className="bg-data-1/60 absolute inset-0 animate-[shimmer_1.5s_ease-in-out_infinite]" />
            </div>
            <span className="text-muted-foreground text-xs">
              {TOOL_LABELS[activeToolName] ?? "Working"}...
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
```

Key changes:
- Concatenates all text parts → renders once with `MarkdownContent`
- Tool invocations are never rendered as content — they drive the shimmer status label
- Streaming caret: blinking `data-1` bar at end of text
- Shimmer bar + tool label shown while tools are active
- User messages stay simple (no markdown needed)

**Step 2: Verify it compiles**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors

**Step 3: Commit**

```bash
cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat
git add src/components/chat/chat-message.tsx
git commit -m "feat: render assistant markdown, hide tool narration, add shimmer"
```

---

### Task 5: Update chat-message-list to pass streaming state

**Files:**
- Modify: `src/components/chat/chat-message-list.tsx`

**Step 1: Pass `isStreaming` to the last assistant message**

The list already receives `isLoading`. We need to pass it through to `ChatMessage` so it can show the streaming caret and shimmer.

Replace the message rendering section in `ChatMessageList`:

Change the map block (lines 33-45) to:

```tsx
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
```

Remove the `{isLoading && <StreamingIndicator />}` line (line 47). The streaming state is now handled inside ChatMessage itself.

Remove the unused `StreamingIndicator` import from line 7.

**Step 2: Verify it compiles**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit 2>&1 | head -20`

Expected: No errors

**Step 3: Commit**

```bash
cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat
git add src/components/chat/chat-message-list.tsx
git commit -m "feat: pass streaming state to ChatMessage, remove StreamingIndicator"
```

---

### Task 6: Restyle hero page and starter prompts

**Files:**
- Modify: `src/app/page.tsx` (hero section, lines 84-118)
- Modify: `src/components/chat/starter-prompts.tsx`

**Step 1: Update hero layout in page.tsx**

In the hero `return` block (line 85-118), change the title and subtitle:

```tsx
<h1 className="text-2xl font-bold tracking-tight">
  Open Data Reports
</h1>
```

Remove the `<p>` subtitle ("Explore public data with natural language") — let the input bar and prompts speak for themselves.

**Step 2: Restyle starter prompts as text links**

Replace the full `StarterPrompts` component:

```tsx
"use client";

import { useCallback, useRef } from "react";

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
      className="flex flex-wrap justify-center gap-x-4 gap-y-2"
      onKeyDown={handleKeyDown}
    >
      {suggestions.map((prompt, index) => (
        <button
          key={prompt}
          ref={(el) => {
            buttonRefs.current[index] = el;
          }}
          type="button"
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 transition-colors hover:underline"
          tabIndex={index === 0 ? 0 : -1}
          onClick={() => onSelect(prompt)}
        >
          {prompt.toLowerCase()}
        </button>
      ))}
    </div>
  );
}
```

Key changes: outline buttons → plain text links, lowercase, muted color, hover underline.

**Step 3: Update chat view message column width**

In the chat view layout (page.tsx lines 128-145), add max-width centering to the message area. Change the inner flex div:

```tsx
<div className="mx-auto flex w-full max-w-[680px] flex-1 flex-col">
```

And the input container:

```tsx
<div className="border-border/50 bg-background sticky bottom-0 mx-auto w-full max-w-[680px] border-t px-4 py-3">
```

**Step 4: Verify dev server renders correctly**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npm run build 2>&1 | tail -5`

Expected: Build succeeds

**Step 5: Commit**

```bash
cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat
git add src/app/page.tsx src/components/chat/starter-prompts.tsx
git commit -m "style: editorial hero layout, text-link prompts, 680px content column"
```

---

### Task 7: Visual QA — open in browser and verify

**Step 1: Start dev server if not running**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npm run dev`

**Step 2: Open http://localhost:3000 in browser**

Verify:
- Hero page: bold title, no subtitle, text-link starter prompts, blue send button
- Click a starter prompt → chat view loads
- Assistant response: markdown rendered (headings, bold, lists)
- Tool calls: shimmer bar with label (no raw narration text)
- Data tables: collapsible with blue left stripe
- Content column: centered ~680px width
- Streaming: blinking blue caret at end of streaming text

**Step 3: Fix any visual issues found**

Address any CSS/layout issues discovered during QA.

**Step 4: Commit any fixes**

```bash
cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat
git add -A
git commit -m "fix: visual QA adjustments"
```
