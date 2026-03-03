# Query Confirmation Panel — Design

## Goal

Add a confirmation step before executing queries so users can verify the system understood their intent before hitting the Socrata API. Uses a "smart blocking" model: confirm on first query or dataset switch, auto-execute on refinements.

## Approach: Tool-Based Confirmation

A new `confirm_query` AI SDK tool that Claude calls after `get_dataset_info` and before `query_dataset`. The tool is a pass-through (returns its own input as output). The value is in rendering, not computation — the UI renders a confirmation card from the tool output.

### Why this approach

- Fits naturally into the existing tool-use architecture
- The confirmation card is just another `ToolResultRenderer` branch
- Blocking/auto-execute logic lives in the system prompt, not client-side interception
- No changes to the streaming pipeline, API route, or session state

### Alternatives considered

- **Client-side interception**: Intercept `query_dataset` mid-stream and defer execution. Fights the Vercel AI SDK's streaming design. Rejected.
- **Two-phase prompt (LLM-only)**: Claude outputs a structured confirmation block in text, UI parses it. Fragile, hard to make blocking. Rejected.

## Tool Schema

**`confirm_query` input/output:**

```ts
{
  dataset: { name: string; id: string; domain: string; rowCount: number };
  soql: string;
  filters: string[];        // Human-readable, e.g. "results = 'Fail'"
  columns: string[];        // Column names that will be returned
  estimatedDescription: string; // One-sentence summary of what the query does
}
```

The `execute` function returns its input verbatim.

## Confirmation Card UI

```
┌─────────────────────────────────────────────────────┐
│  Query Plan                                          │
│                                                      │
│  "Show failed food inspections since January 2025"   │
│                                                      │
│  Dataset    Food Inspections (ijzp-q8t2)             │
│  Rows       ~234K total                              │
│  Filters    results = 'Fail'                         │
│             inspection_date >= '2025-01-01'           │
│  Columns    dba_name, inspection_date, results,      │
│             risk, violations                          │
│                                                      │
│  [Run this query]          [Adjust]  [Edit filters]  │
└─────────────────────────────────────────────────────┘
```

### Actions

1. **"Run this query"** — Sends a user message (`"Go ahead, run it"`) which Claude interprets as confirmation and proceeds to `query_dataset`. Primary action, visually emphasized.

2. **"Adjust"** — Focuses the chat input and pre-fills with `"Actually, I'd like to change..."` for conversational correction.

3. **"Edit filters"** — Expands inline filter editing below the card:
   - Each filter as an editable row (column, operator, value) with remove (x) button
   - "Add filter" link
   - "Apply & Run" button sends a message describing the modified filters

Card disables all buttons after an action is taken.

## Smart Blocking Logic

Controlled entirely via system prompt instructions:

- **Confirm when:** First query in conversation, or querying a different dataset than the active one
- **Skip when:** User is refining/filtering/re-querying the same active dataset

Claude already has `activeDataset` in the context section. If it's null (first query) or the dataset ID changes, Claude confirms. If the user says "filter by ward 44" on the same dataset, Claude goes straight to `query_dataset`.

This is a strong hint, not a hard gate. Occasional over/under-confirmation is not harmful.

## Files

**New:**
- `src/components/data/query-confirmation-card.tsx`

**Modified:**
- `src/lib/socrata/tools.ts` — Add `confirm_query` tool
- `src/lib/prompts/system-prompt.ts` — Update conversation flow and tool instructions
- `src/components/chat/tool-result-renderer.tsx` — Add `confirm_query` branch
- `src/types/index.ts` — Align `QueryConfirmation` type with tool output shape

**Unchanged:**
- API route, session state, chat transport, streaming pipeline

## Data Flow

```
User asks question
    → Claude calls search_datasets → dataset cards render
    → Claude calls get_dataset_info → sidebar updates
    → Claude calls confirm_query → confirmation card renders, Claude stops
    → User clicks "Run this query" → sends message
    → Claude calls query_dataset → data table renders
    → User says "filter by ward 44" → Claude skips confirm, calls query_dataset directly
```
