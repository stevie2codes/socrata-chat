# Structured Filter Editor Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create an implementation plan from this design, then use superpowers:executing-plans to implement it task-by-task.

**Goal:** Replace the raw text filter inputs in the query confirmation card with structured dropdowns (column, operator, value) that adapt to column data types. Edited filters are sent as a hybrid chat message that Claude interprets to run the modified query.

---

## Data Model

### New types (`src/types/index.ts`)

```ts
export interface StructuredFilter {
  column: string;        // fieldName from the dataset schema
  operator: string;      // "=", "!=", ">", "<", ">=", "<=", "LIKE"
  value: string;         // the literal value
  label: string;         // human-readable, e.g. "results = 'Fail'"
}

export interface ColumnMeta {
  fieldName: string;
  name: string;          // display name
  dataType: string;      // "text", "number", "calendar_date", etc.
  description?: string;
}
```

### Updated `QueryConfirmation`

```ts
export interface QueryConfirmation {
  dataset: {
    name: string;
    id: string;
    domain: string;
    rowCount: number;
  };
  soql: string;
  filters: StructuredFilter[];    // was string[]
  columns: string[];
  estimatedDescription: string;
  availableColumns: ColumnMeta[]; // new — schema info for dropdowns
}
```

### Tool schema (`src/lib/socrata/tools.ts`)

Update `confirm_query` Zod schema to match — `filters` becomes an array of `{column, operator, value, label}` objects, add `availableColumns` array of `{fieldName, name, dataType, description?}`. Update the tool description to instruct Claude to produce structured filters and pass along the columns it inspected from `get_dataset_info`.

---

## Filter Editor UI

### Component: `FilterEditor` (`src/components/data/filter-editor.tsx`)

Extracted from `QueryConfirmationCard`. Manages local filter state, exposes current filters via `onChange` callback.

**Two modes:**

1. **Display mode (default):** Each filter renders as a badge showing the `label` text. Clicking a badge enters edit mode for that filter. An X on each badge removes it.

2. **Edit mode (per-filter):** Expands into a row with three controls:

| Control | Behavior |
|---------|----------|
| **Column** dropdown | Shows display name from `availableColumns`, sorted alphabetically. |
| **Operator** dropdown | Options depend on `dataType` of selected column — text: `=, !=, LIKE`; number: `=, !=, >, <, >=, <=`; calendar_date: `=, >, <, >=, <=`. |
| **Value** input | Plain text for strings, number input for numbers, date input for `calendar_date`. |

- "Add filter" button appends a new empty row in edit mode.
- Clicking outside or pressing Enter collapses back to badge display.
- `onChange(filters: StructuredFilter[])` fires on every edit so the parent always has current state.

### Updated: `QueryConfirmationCard`

- Replaces inline raw text editor section with `<FilterEditor>`.
- Passes `availableColumns` and `filters` to `FilterEditor`.
- `onRun` callback receives the current `StructuredFilter[]` from the editor (not the original tool output).

---

## Hybrid Execution

### Callback: `handleConfirmRun` in `page.tsx`

Receives `{ original: StructuredFilter[], current: StructuredFilter[] }`. Diffs them:

- **No changes:** sends `"Go ahead, run it"`
- **Filters modified:** composes a message like `"Run the query on [dataset] with these filters: results = 'Fail', ward = '44'. Remove the date filter."`
  - Added filters described as additions
  - Removed filters explicitly noted
  - Changed values described as changes

Claude sees the structured hint and calls `query_dataset` with updated SoQL in one turn.

### Callback: `handleConfirmAdjust`

Unchanged — prefills input with "Actually, I'd like to change " and focuses.

---

## Files Changed

| File | Action | What changes |
|------|--------|-------------|
| `src/types/index.ts` | Modify | Add `StructuredFilter`, `ColumnMeta`; update `QueryConfirmation` |
| `src/lib/socrata/tools.ts` | Modify | Update `confirm_query` Zod schema for structured filters + `availableColumns` |
| `src/components/data/filter-editor.tsx` | Create | New component: badge display + structured edit mode |
| `src/components/data/query-confirmation-card.tsx` | Modify | Replace raw text editor with `FilterEditor`, update `onRun` to pass current filters |
| `src/components/chat/tool-result-renderer.tsx` | Modify | Update `onConfirmRun` signature to pass `{original, current}` |
| `src/app/page.tsx` | Modify | Simplify `handleConfirmRun` to diff structured filters and compose message |

No changes needed to `ChatMessage`, `ChatMessageList`, or system prompt.

---

## Operator Map by Data Type

```ts
const OPERATORS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  text: [
    { value: "=", label: "equals" },
    { value: "!=", label: "not equals" },
    { value: "LIKE", label: "contains" },
  ],
  number: [
    { value: "=", label: "=" },
    { value: "!=", label: "!=" },
    { value: ">", label: ">" },
    { value: "<", label: "<" },
    { value: ">=", label: ">=" },
    { value: "<=", label: "<=" },
  ],
  calendar_date: [
    { value: "=", label: "on" },
    { value: ">", label: "after" },
    { value: "<", label: "before" },
    { value: ">=", label: "on or after" },
    { value: "<=", label: "on or before" },
  ],
};
// Fallback to text operators for unknown types
```
