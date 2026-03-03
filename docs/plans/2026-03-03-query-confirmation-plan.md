# Query Confirmation Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a confirmation step before executing queries so users can verify the system understood their intent — blocking on first query, auto-executing on refinements.

**Architecture:** A new `confirm_query` pass-through tool that Claude calls before `query_dataset`. The tool output renders as an interactive confirmation card. The card's buttons send chat messages that Claude interprets to proceed, adjust, or re-run with modified filters. Smart blocking logic lives in the system prompt.

**Tech Stack:** AI SDK `tool()`, Zod schema, React component with Tailwind/shadcn styling, system prompt updates.

---

### Task 1: Update the `QueryConfirmation` type

**Files:**
- Modify: `src/types/index.ts:20-25`

**Step 1: Replace the existing `QueryConfirmation` interface**

The current type references a full `SocrataDataset` and `QueryFilter[]`, but the tool needs a lighter shape that Claude can produce from context. Replace it:

```ts
export interface QueryConfirmation {
  dataset: {
    name: string;
    id: string;
    domain: string;
    rowCount: number;
  };
  soql: string;
  filters: string[];
  columns: string[];
  estimatedDescription: string;
}
```

**Step 2: Verify the build still passes**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit`
Expected: PASS (no other file imports `QueryConfirmation` yet)

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "refactor: update QueryConfirmation type for tool-based confirmation"
```

---

### Task 2: Add the `confirm_query` tool

**Files:**
- Modify: `src/lib/socrata/tools.ts:155-166`

**Step 1: Add the tool definition before the export block**

Insert after `query_dataset` (after line 155) and before the export (line 162):

```ts
const confirm_query = tool({
  description:
    "Present a query plan to the user for confirmation before executing. " +
    "Call this BEFORE query_dataset when this is the first query in the conversation " +
    "or when switching to a different dataset. Skip this tool for follow-up " +
    "refinements on the same dataset. The tool returns the plan for the UI to render " +
    "as an interactive confirmation card.",
  inputSchema: z.object({
    dataset: z.object({
      name: z.string().describe("Human-readable dataset name"),
      id: z.string().describe("Socrata 4x4 dataset ID"),
      domain: z.string().describe("Portal hostname"),
      rowCount: z.number().describe("Total rows in the dataset"),
    }),
    soql: z
      .string()
      .describe("The SoQL query you intend to execute"),
    filters: z
      .array(z.string())
      .describe(
        'Human-readable filter descriptions, e.g. ["results = \'Fail\'", "date >= \'2025-01-01\'"]'
      ),
    columns: z
      .array(z.string())
      .describe("Column names that will be returned by the query"),
    estimatedDescription: z
      .string()
      .describe("One-sentence plain-English summary of what this query does"),
  }),
  execute: async (input) => input,
});
```

**Step 2: Add `confirm_query` to the export**

Change the `socrataTools` export at line 162-166 to:

```ts
export const socrataTools = {
  search_datasets,
  get_dataset_info,
  confirm_query,
  query_dataset,
} as const;
```

**Step 3: Verify the build**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/socrata/tools.ts
git commit -m "feat: add confirm_query pass-through tool"
```

---

### Task 3: Update the system prompt

**Files:**
- Modify: `src/lib/prompts/system-prompt.ts:39-48` (buildConversationFlowSection)
- Modify: `src/lib/prompts/system-prompt.ts:51-81` (buildToolInstructionsSection)

**Step 1: Update `buildConversationFlowSection`**

Replace the function body (lines 39-48) with:

```ts
function buildConversationFlowSection(): string {
  return `## Conversation Flow

Follow the Orient -> Query -> Refine pattern:

1. **Orient**: Help the user find the right dataset. Use \`search_datasets\` to discover datasets matching their question. Present the top matches with names, descriptions, and row counts so the user can pick one.
2. **Query**: Once a dataset is selected, inspect it with \`get_dataset_info\` to learn the schema. Then:
   - **First query or new dataset**: Call \`confirm_query\` to show the user your query plan. Wait for them to confirm before proceeding to \`query_dataset\`.
   - **Refinement on same dataset**: Skip \`confirm_query\` and call \`query_dataset\` directly.
3. **Refine**: After showing results, suggest follow-up explorations — filtering by a different column, aggregating differently, or comparing with another dataset.

If the user's intent is ambiguous, ask a short clarifying question rather than guessing.`;
}
```

**Step 2: Add `confirm_query` instructions to `buildToolInstructionsSection`**

Insert after the `get_dataset_info` section and before the `query_dataset` section (around line 65). Add this block:

```
### confirm_query
- Call this **before** \`query_dataset\` when: (a) this is the first query in the conversation, OR (b) you are querying a different dataset than the one in the Current Context section.
- **Skip** this tool when the user is refining, filtering, or re-querying the same active dataset.
- Fill in all fields: dataset info, the SoQL you plan to run, human-readable filter descriptions, the columns you'll return, and a one-sentence description.
- After calling this tool, **stop and wait** for the user to confirm. Do NOT call \`query_dataset\` in the same turn.
```

**Step 3: Verify the build**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/prompts/system-prompt.ts
git commit -m "feat: update system prompt with confirm_query instructions"
```

---

### Task 4: Create the `QueryConfirmationCard` component

**Files:**
- Create: `src/components/data/query-confirmation-card.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";
import { Play, MessageSquare, SlidersHorizontal, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { QueryConfirmation } from "@/types";

interface QueryConfirmationCardProps {
  confirmation: QueryConfirmation;
  onRun: () => void;
  onAdjust: () => void;
}

export function QueryConfirmationCard({
  confirmation,
  onRun,
  onAdjust,
}: QueryConfirmationCardProps) {
  const [acted, setActed] = useState(false);
  const [editingFilters, setEditingFilters] = useState(false);
  const [filters, setFilters] = useState<string[]>(confirmation.filters);

  const handleRun = () => {
    setActed(true);
    onRun();
  };

  const handleAdjust = () => {
    setActed(true);
    onAdjust();
  };

  const handleApplyAndRun = () => {
    setActed(true);
    // onRun will send a message — the parent constructs it with the current filters
    onRun();
  };

  const handleRemoveFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddFilter = () => {
    setFilters((prev) => [...prev, ""]);
  };

  const handleFilterChange = (index: number, value: string) => {
    setFilters((prev) => prev.map((f, i) => (i === index ? value : f)));
  };

  const formatRowCount = (n: number): string => {
    if (n >= 1_000_000) return `~${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `~${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div
      role="region"
      aria-label="Query confirmation"
      className={cn(
        "glass-subtle my-3 rounded-xl border border-white/[0.08] px-5 py-4",
        acted && "opacity-60 pointer-events-none"
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
          <Play className="size-3 text-primary" aria-hidden="true" />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Query Plan
        </h3>
      </div>

      {/* Description */}
      <p className="mb-4 text-sm text-foreground/90">
        {confirmation.estimatedDescription}
      </p>

      {/* Details grid */}
      <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
        <dt className="font-medium text-muted-foreground">Dataset</dt>
        <dd className="text-foreground">
          {confirmation.dataset.name}{" "}
          <span className="text-muted-foreground">
            ({confirmation.dataset.id})
          </span>
        </dd>

        <dt className="font-medium text-muted-foreground">Rows</dt>
        <dd className="text-foreground">
          {formatRowCount(confirmation.dataset.rowCount)} total
        </dd>

        {confirmation.filters.length > 0 && (
          <>
            <dt className="font-medium text-muted-foreground">Filters</dt>
            <dd className="flex flex-wrap gap-1">
              {confirmation.filters.map((f, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] font-mono font-normal">
                  {f}
                </Badge>
              ))}
            </dd>
          </>
        )}

        {confirmation.columns.length > 0 && (
          <>
            <dt className="font-medium text-muted-foreground">Columns</dt>
            <dd className="text-foreground">
              {confirmation.columns.join(", ")}
            </dd>
          </>
        )}
      </dl>

      {/* Inline filter editor (expandable) */}
      {editingFilters && (
        <div className="mb-4 space-y-2 rounded-lg bg-white/[0.03] px-3 py-3">
          {filters.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={f}
                onChange={(e) => handleFilterChange(i, e.target.value)}
                className="flex-1 rounded-md border border-white/[0.1] bg-transparent px-2 py-1 text-xs text-foreground outline-none focus:border-primary/40"
                placeholder="e.g. date >= '2025-01-01'"
                aria-label={`Filter ${i + 1}`}
              />
              <button
                onClick={() => handleRemoveFilter(i)}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Remove filter ${i + 1}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          <button
            onClick={handleAddFilter}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-3" /> Add filter
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRun}
          disabled={acted}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all",
            "bg-primary text-primary-foreground",
            "shadow-[0_0_20px_oklch(0.68_0.16_250_/_0.3)]",
            "hover:shadow-[0_0_28px_oklch(0.68_0.16_250_/_0.45)] hover:scale-[1.02]",
            "active:scale-[0.98]",
            "disabled:opacity-40 disabled:pointer-events-none"
          )}
        >
          <Play className="size-3" aria-hidden="true" />
          {editingFilters ? "Apply & Run" : "Run this query"}
        </button>

        <button
          onClick={handleAdjust}
          disabled={acted}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
        >
          <MessageSquare className="size-3" aria-hidden="true" />
          Adjust
        </button>

        <button
          onClick={() => setEditingFilters((prev) => !prev)}
          disabled={acted}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
        >
          <SlidersHorizontal className="size-3" aria-hidden="true" />
          Edit filters
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Verify the build**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/data/query-confirmation-card.tsx
git commit -m "feat: add QueryConfirmationCard component"
```

---

### Task 5: Wire confirmation card into `ToolResultRenderer`

**Files:**
- Modify: `src/components/chat/tool-result-renderer.tsx`

**Step 1: Update the component to accept action callbacks and render the confirmation card**

Replace the entire file:

```tsx
"use client";

import type { CatalogResult, QueryResult } from "@/lib/socrata/api-client";
import type { QueryConfirmation } from "@/types";
import { DatasetCardList } from "@/components/data/dataset-card-list";
import { DataTable } from "@/components/data/data-table";
import { QueryConfirmationCard } from "@/components/data/query-confirmation-card";

interface ToolResultRendererProps {
  toolName: string;
  output: unknown;
  onConfirmRun?: (confirmation: QueryConfirmation) => void;
  onConfirmAdjust?: () => void;
}

function isCatalogResults(output: unknown): output is CatalogResult[] {
  return (
    Array.isArray(output) &&
    output.length > 0 &&
    typeof output[0] === "object" &&
    output[0] !== null &&
    "permalink" in output[0]
  );
}

function isQueryResult(output: unknown): output is QueryResult {
  return (
    typeof output === "object" &&
    output !== null &&
    "data" in output &&
    Array.isArray((output as Record<string, unknown>).data)
  );
}

function isQueryConfirmation(output: unknown): output is QueryConfirmation {
  return (
    typeof output === "object" &&
    output !== null &&
    "soql" in output &&
    "dataset" in output &&
    "estimatedDescription" in output
  );
}

export function ToolResultRenderer({
  toolName,
  output,
  onConfirmRun,
  onConfirmAdjust,
}: ToolResultRendererProps) {
  if (toolName === "search_datasets" && isCatalogResults(output)) {
    return <DatasetCardList datasets={output} />;
  }

  if (toolName === "confirm_query" && isQueryConfirmation(output)) {
    return (
      <QueryConfirmationCard
        confirmation={output}
        onRun={() => onConfirmRun?.(output)}
        onAdjust={() => onConfirmAdjust?.()}
      />
    );
  }

  if (toolName === "query_dataset" && isQueryResult(output)) {
    return <DataTable result={output} />;
  }

  return null;
}
```

**Step 2: Update `ChatMessage` to pass the new props through**

In `src/components/chat/chat-message.tsx`, update the `ChatMessageProps` interface to add:

```ts
onConfirmRun?: (confirmation: QueryConfirmation) => void;
onConfirmAdjust?: () => void;
```

Add the import:

```ts
import type { QueryConfirmation } from "@/types";
```

Destructure the new props in the component signature, and pass them to `ToolResultRenderer`:

```tsx
<ToolResultRenderer
  key={i}
  toolName={getToolName(part as Parameters<typeof getToolName>[0])}
  output={(part as Record<string, unknown>).output}
  onConfirmRun={onConfirmRun}
  onConfirmAdjust={onConfirmAdjust}
/>
```

**Step 3: Update `ChatMessageList` to pass the props through**

In `src/components/chat/chat-message-list.tsx`, add the same two props to `ChatMessageListProps` and pass them through to each `ChatMessage`.

**Step 4: Verify the build**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/chat/tool-result-renderer.tsx src/components/chat/chat-message.tsx src/components/chat/chat-message-list.tsx
git commit -m "feat: wire QueryConfirmationCard into tool result rendering"
```

---

### Task 6: Wire the confirmation actions in `page.tsx`

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Add the `confirm_query` label to `ChatMessage`**

In `src/components/chat/chat-message.tsx`, add to `TOOL_LABELS` at line 19-23:

```ts
const TOOL_LABELS: Record<string, string> = {
  search_datasets: "Searching datasets",
  get_dataset_info: "Reading dataset schema",
  confirm_query: "Preparing query plan",
  query_dataset: "Querying data",
};
```

**Step 2: Add confirmation handlers in `page.tsx`**

After the `handleSuggestionSelect` callback (around line 89), add:

```ts
const handleConfirmRun = useCallback(
  (confirmation: QueryConfirmation) => {
    const filtersChanged =
      JSON.stringify(confirmation.filters) !==
      JSON.stringify(
        (messagesRef.current
          .flatMap((m) => m.parts)
          .find(
            (p) =>
              isToolUIPart(p) &&
              getToolName(p) === "confirm_query" &&
              p.state === "output-available"
          ) as Record<string, unknown> | undefined)?.output &&
          (
            (messagesRef.current
              .flatMap((m) => m.parts)
              .find(
                (p) =>
                  isToolUIPart(p) &&
                  getToolName(p) === "confirm_query" &&
                  p.state === "output-available"
              ) as Record<string, unknown>)?.output as QueryConfirmation
          )?.filters
      );

    if (filtersChanged) {
      sendMessage({
        text: `Run the query with these filters: ${confirmation.filters.filter(Boolean).join(", ")}`,
      });
    } else {
      sendMessage({ text: "Go ahead, run it" });
    }
  },
  [sendMessage]
);

const handleConfirmAdjust = useCallback(() => {
  setInput("Actually, I'd like to change ");
  setTimeout(() => inputRef.current?.focus(), 0);
}, []);
```

Add the import at the top:

```ts
import type { QueryConfirmation } from "@/types";
```

**Step 3: Pass the handlers to `ChatMessageList`**

Update the `ChatMessageList` usage in the JSX (around line 214):

```tsx
<ChatMessageList
  messages={messages}
  isLoading={isLoading}
  onSuggestionSelect={handleSuggestionSelect}
  onConfirmRun={handleConfirmRun}
  onConfirmAdjust={handleConfirmAdjust}
/>
```

**Step 4: Verify the build**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/page.tsx src/components/chat/chat-message.tsx
git commit -m "feat: wire confirmation Run/Adjust actions to chat messages"
```

---

### Task 7: Manual integration test

**Step 1: Start the dev server**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npm run dev`

**Step 2: Test the first-query confirmation flow**

1. Open http://localhost:3000
2. Type "Show me food inspection failures in Chicago"
3. Expected: Claude calls `search_datasets`, then `get_dataset_info`, then `confirm_query`
4. A confirmation card should render with dataset name, SoQL, filters, columns, and description
5. Click "Run this query" — Claude should proceed to `query_dataset` and show results

**Step 3: Test the refinement skip**

1. After results appear, type "now filter by ward 44"
2. Expected: Claude calls `query_dataset` directly — NO confirmation card

**Step 4: Test the Adjust flow**

1. Start a new chat, trigger a confirmation card again
2. Click "Adjust" — the chat input should focus with pre-filled text
3. Type a correction and send — Claude should produce a new confirmation card

**Step 5: Test the Edit Filters flow**

1. Start a new chat, trigger a confirmation card again
2. Click "Edit filters" — inline filter editor should expand
3. Modify a filter value and click "Apply & Run"
4. Expected: A message is sent with the modified filters

**Step 6: Commit after verifying**

```bash
git add -A
git commit -m "feat: query confirmation panel — complete"
```
