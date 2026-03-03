# Structured Filter Editor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the raw text filter inputs in `QueryConfirmationCard` with structured dropdowns (column, operator, value) that adapt to column data types, and compose hybrid chat messages from the diff.

**Architecture:** Reuse existing `QueryFilter` and `DatasetColumn` types (identical to the design's `StructuredFilter` / `ColumnMeta`). Widen the `confirm_query` tool schema so Claude sends structured filter objects + `availableColumns`. A new `FilterEditor` component renders badge-display and per-filter edit rows. The parent diffs original vs. current filters and composes a natural-language message for Claude.

**Tech Stack:** Next.js 16 + React 19, Vercel AI SDK v6, Zod v4, shadcn/ui (new-york), Tailwind CSS v4, Vitest + React Testing Library

**Design doc:** [`docs/plans/2026-03-03-structured-filter-editor-design.md`](docs/plans/2026-03-03-structured-filter-editor-design.md)

---

## Task 1: Install Vitest + React Testing Library

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

**Step 1: Install dev dependencies**

Run:
```bash
cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Step 2: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Step 3: Create test setup file**

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

**Step 4: Add test script to package.json**

Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Verify test runner works**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npm test`
Expected: Vitest exits with "No test files found" (not an error — just no tests yet).

**Step 6: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json package-lock.json
git commit -m "chore: add Vitest + React Testing Library"
```

---

## Task 2: Install shadcn Select component

**Files:**
- Create: `src/components/ui/select.tsx`

**Step 1: Install select**

Run:
```bash
cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx shadcn@latest add select -y
```

**Step 2: Verify file created**

Run: `ls src/components/ui/select.tsx`
Expected: File exists.

**Step 3: Commit**

```bash
git add src/components/ui/select.tsx
git commit -m "chore: add shadcn select component"
```

---

## Task 3: Create operator constants

**Files:**
- Create: `src/lib/filter-operators.ts`
- Create: `src/lib/__tests__/filter-operators.test.ts`

**Step 1: Write the failing test**

Create `src/lib/__tests__/filter-operators.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getOperatorsForType, OPERATORS_BY_TYPE } from "../filter-operators";

describe("getOperatorsForType", () => {
  it("returns text operators for 'text' type", () => {
    const ops = getOperatorsForType("text");
    expect(ops.map((o) => o.value)).toEqual(["=", "!=", "LIKE"]);
  });

  it("returns number operators for 'number' type", () => {
    const ops = getOperatorsForType("number");
    expect(ops.map((o) => o.value)).toEqual(["=", "!=", ">", "<", ">=", "<="]);
  });

  it("returns date operators for 'calendar_date' type", () => {
    const ops = getOperatorsForType("calendar_date");
    expect(ops.map((o) => o.value)).toEqual(["=", ">", "<", ">=", "<="]);
  });

  it("falls back to text operators for unknown types", () => {
    const ops = getOperatorsForType("blob");
    expect(ops).toEqual(OPERATORS_BY_TYPE.text);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run src/lib/__tests__/filter-operators.test.ts`
Expected: FAIL — module not found.

**Step 3: Write implementation**

Create `src/lib/filter-operators.ts`:

```ts
export interface OperatorOption {
  value: string;
  label: string;
}

export const OPERATORS_BY_TYPE: Record<string, OperatorOption[]> = {
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

export function getOperatorsForType(dataType: string): OperatorOption[] {
  return OPERATORS_BY_TYPE[dataType] ?? OPERATORS_BY_TYPE.text;
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run src/lib/__tests__/filter-operators.test.ts`
Expected: PASS — all 4 tests green.

**Step 5: Commit**

```bash
git add src/lib/filter-operators.ts src/lib/__tests__/filter-operators.test.ts
git commit -m "feat: add operator constants by column data type"
```

---

## Task 4: Update types — `QueryConfirmation`

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Update `QueryConfirmation` interface**

Change `filters` from `string[]` to `QueryFilter[]` and add `availableColumns`:

```ts
export interface QueryConfirmation {
  dataset: {
    name: string;
    id: string;
    domain: string;
    rowCount: number;
  };
  soql: string;
  filters: QueryFilter[];           // was string[]
  columns: string[];
  estimatedDescription: string;
  availableColumns: DatasetColumn[]; // new — schema for dropdowns
}
```

Note: `QueryFilter` and `DatasetColumn` already exist in this file — no new interfaces needed.

**Step 2: Verify TypeScript compiles**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit 2>&1 | head -40`
Expected: Type errors in files that still use `string[]` for filters (tools.ts, query-confirmation-card.tsx, page.tsx). This is expected — we'll fix them in subsequent tasks.

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: update QueryConfirmation to use structured filters"
```

---

## Task 5: Update `confirm_query` tool schema

**Files:**
- Modify: `src/lib/socrata/tools.ts`

**Step 1: Update the Zod schema**

Replace the `confirm_query` tool definition. The `filters` field becomes an array of structured objects and `availableColumns` is added:

```ts
const confirm_query = tool({
  description:
    "Present a query plan to the user for confirmation before executing. " +
    "Call this BEFORE query_dataset when this is the first query in the conversation " +
    "or when switching to a different dataset. Skip this tool for follow-up " +
    "refinements on the same dataset. The tool returns the plan for the UI to render " +
    "as an interactive confirmation card. " +
    "IMPORTANT: filters must be structured objects with column, operator, value, and label. " +
    "availableColumns should include all columns from the dataset schema (from get_dataset_info).",
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
      .array(
        z.object({
          column: z.string().describe("fieldName from the dataset schema"),
          operator: z.string().describe('SoQL operator: "=", "!=", ">", "<", ">=", "<=", or "LIKE"'),
          value: z.string().describe("The literal filter value"),
          label: z.string().describe('Human-readable label, e.g. "results = \'Fail\'"'),
        })
      )
      .describe("Structured filters applied to this query"),
    columns: z
      .array(z.string())
      .describe("Column names that will be returned by the query"),
    estimatedDescription: z
      .string()
      .describe("One-sentence plain-English summary of what this query does"),
    availableColumns: z
      .array(
        z.object({
          fieldName: z.string().describe("API field name"),
          name: z.string().describe("Human-readable column name"),
          dataType: z.string().describe('Socrata data type: "text", "number", "calendar_date", etc.'),
          description: z.string().optional().describe("Column description if available"),
        })
      )
      .describe("All columns from the dataset schema, for the filter editor dropdowns"),
  }),
  execute: async (input) => input,
});
```

**Step 2: Verify TypeScript compiles for this file**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit 2>&1 | grep tools.ts`
Expected: No errors in `tools.ts` (errors may remain in other files — that's fine).

**Step 3: Commit**

```bash
git add src/lib/socrata/tools.ts
git commit -m "feat: update confirm_query schema for structured filters + availableColumns"
```

---

## Task 6: Create FilterEditor component — tests first

**Files:**
- Create: `src/components/data/__tests__/filter-editor.test.tsx`

**Step 1: Write component tests**

Create `src/components/data/__tests__/filter-editor.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterEditor } from "../filter-editor";
import type { DatasetColumn, QueryFilter } from "@/types";

const columns: DatasetColumn[] = [
  { fieldName: "name", name: "Name", dataType: "text" },
  { fieldName: "age", name: "Age", dataType: "number" },
  { fieldName: "created", name: "Created", dataType: "calendar_date" },
];

const filters: QueryFilter[] = [
  { column: "name", operator: "=", value: "Alice", label: "name = 'Alice'" },
];

describe("FilterEditor", () => {
  it("renders filter badges in display mode", () => {
    render(
      <FilterEditor
        filters={filters}
        availableColumns={columns}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("name = 'Alice'")).toBeInTheDocument();
  });

  it("calls onChange when a filter is removed via the X button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterEditor
        filters={filters}
        availableColumns={columns}
        onChange={onChange}
      />
    );
    await user.click(screen.getByLabelText("Remove filter: name = 'Alice'"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("enters edit mode when a badge is clicked", async () => {
    const user = userEvent.setup();
    render(
      <FilterEditor
        filters={filters}
        availableColumns={columns}
        onChange={() => {}}
      />
    );
    await user.click(screen.getByText("name = 'Alice'"));
    // Should now show column dropdown with "Name" selected
    expect(screen.getByDisplayValue("name")).toBeInTheDocument();
  });

  it("shows Add filter button", () => {
    render(
      <FilterEditor
        filters={[]}
        availableColumns={columns}
        onChange={() => {}}
      />
    );
    expect(screen.getByText("Add filter")).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run src/components/data/__tests__/filter-editor.test.tsx`
Expected: FAIL — module `../filter-editor` not found.

**Step 3: Commit test file**

```bash
git add src/components/data/__tests__/filter-editor.test.tsx
git commit -m "test: add FilterEditor component tests (red)"
```

---

## Task 7: Create FilterEditor component

**Files:**
- Create: `src/components/data/filter-editor.tsx`

**Step 1: Write the component**

Create `src/components/data/filter-editor.tsx`:

```tsx
"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOperatorsForType } from "@/lib/filter-operators";
import type { DatasetColumn, QueryFilter } from "@/types";

interface FilterEditorProps {
  filters: QueryFilter[];
  availableColumns: DatasetColumn[];
  onChange: (filters: QueryFilter[]) => void;
}

function buildLabel(column: string, operator: string, value: string): string {
  if (operator === "LIKE") return `${column} contains '${value}'`;
  return `${column} ${operator} '${value}'`;
}

function getInputType(dataType: string): string {
  if (dataType === "number") return "number";
  if (dataType === "calendar_date") return "date";
  return "text";
}

export function FilterEditor({
  filters,
  availableColumns,
  onChange,
}: FilterEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const columnsByField = new Map(
    availableColumns.map((c) => [c.fieldName, c])
  );

  const handleRemove = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleUpdate = (index: number, patch: Partial<QueryFilter>) => {
    const updated = filters.map((f, i) => {
      if (i !== index) return f;
      const next = { ...f, ...patch };
      next.label = buildLabel(next.column, next.operator, next.value);
      return next;
    });
    onChange(updated);
  };

  const handleColumnChange = (index: number, fieldName: string) => {
    const col = columnsByField.get(fieldName);
    const dataType = col?.dataType ?? "text";
    const operators = getOperatorsForType(dataType);
    const currentOp = filters[index].operator;
    const validOp = operators.find((o) => o.value === currentOp)
      ? currentOp
      : operators[0].value;
    handleUpdate(index, { column: fieldName, operator: validOp });
  };

  const handleAddFilter = () => {
    const firstCol = availableColumns[0];
    const newFilter: QueryFilter = {
      column: firstCol?.fieldName ?? "",
      operator: "=",
      value: "",
      label: "",
    };
    onChange([...filters, newFilter]);
    setEditingIndex(filters.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setEditingIndex(null);
    }
  };

  const sortedColumns = [...availableColumns].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-2">
      {filters.map((filter, i) => {
        if (editingIndex === i) {
          const col = columnsByField.get(filter.column);
          const dataType = col?.dataType ?? "text";
          const operators = getOperatorsForType(dataType);

          return (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2"
              onKeyDown={handleKeyDown}
            >
              {/* Column selector */}
              <Select
                value={filter.column}
                onValueChange={(v) => handleColumnChange(i, v)}
              >
                <SelectTrigger className="h-7 w-[140px] border-white/[0.1] bg-transparent text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortedColumns.map((col) => (
                    <SelectItem key={col.fieldName} value={col.fieldName}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Operator selector */}
              <Select
                value={filter.operator}
                onValueChange={(v) => handleUpdate(i, { operator: v })}
              >
                <SelectTrigger className="h-7 w-[100px] border-white/[0.1] bg-transparent text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Value input */}
              <input
                type={getInputType(dataType)}
                value={filter.value}
                onChange={(e) => handleUpdate(i, { value: e.target.value })}
                onBlur={() => setEditingIndex(null)}
                className="flex-1 rounded-md border border-white/[0.1] bg-transparent px-2 py-1 text-xs text-foreground outline-none focus:border-primary/40"
                placeholder="value"
                aria-label={`Value for ${filter.column} filter`}
                autoFocus
              />

              <button
                onClick={() => handleRemove(i)}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Remove filter: ${filter.label}`}
              >
                <X className="size-3" />
              </button>
            </div>
          );
        }

        return (
          <div key={i} className="inline-flex items-center gap-1 mr-1">
            <Badge
              variant="secondary"
              className="cursor-pointer text-[10px] font-mono font-normal hover:bg-secondary/80"
              onClick={() => setEditingIndex(i)}
            >
              {filter.label}
            </Badge>
            <button
              onClick={() => handleRemove(i)}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label={`Remove filter: ${filter.label}`}
            >
              <X className="size-2.5" />
            </button>
          </div>
        );
      })}

      <button
        onClick={handleAddFilter}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
      >
        <Plus className="size-3" /> Add filter
      </button>
    </div>
  );
}
```

**Step 2: Run tests**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run src/components/data/__tests__/filter-editor.test.tsx`
Expected: Tests pass (some may need adjustment based on exact DOM structure — iterate until green).

**Step 3: Commit**

```bash
git add src/components/data/filter-editor.tsx
git commit -m "feat: create FilterEditor component with badge display + structured editing"
```

---

## Task 8: Update QueryConfirmationCard

**Files:**
- Modify: `src/components/data/query-confirmation-card.tsx`

**Step 1: Rewrite QueryConfirmationCard to use FilterEditor**

Replace the entire component. Key changes:
- Props: `onRun` now receives `{ original: QueryFilter[], current: QueryFilter[] }`
- Import and render `FilterEditor` instead of inline text inputs
- Remove `editingFilters` toggle — the FilterEditor handles its own display/edit state
- Track local filter state via `useState<QueryFilter[]>`
- Remove unused `SlidersHorizontal` import

```tsx
"use client";

import { useState } from "react";
import { Play, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FilterEditor } from "@/components/data/filter-editor";
import { cn } from "@/lib/utils";
import type { QueryConfirmation, QueryFilter } from "@/types";

interface QueryConfirmationCardProps {
  confirmation: QueryConfirmation;
  onRun: (filters: { original: QueryFilter[]; current: QueryFilter[] }) => void;
  onAdjust: () => void;
}

export function QueryConfirmationCard({
  confirmation,
  onRun,
  onAdjust,
}: QueryConfirmationCardProps) {
  const [acted, setActed] = useState(false);
  const [filters, setFilters] = useState<QueryFilter[]>(confirmation.filters);

  const handleRun = () => {
    setActed(true);
    onRun({ original: confirmation.filters, current: filters });
  };

  const handleAdjust = () => {
    setActed(true);
    onAdjust();
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

        {filters.length > 0 && (
          <>
            <dt className="font-medium text-muted-foreground">Filters</dt>
            <dd>
              <FilterEditor
                filters={filters}
                availableColumns={confirmation.availableColumns}
                onChange={setFilters}
              />
            </dd>
          </>
        )}

        {filters.length === 0 && (
          <>
            <dt className="font-medium text-muted-foreground">Filters</dt>
            <dd>
              <FilterEditor
                filters={filters}
                availableColumns={confirmation.availableColumns}
                onChange={setFilters}
              />
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
          Run this query
        </button>

        <button
          onClick={handleAdjust}
          disabled={acted}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
        >
          <MessageSquare className="size-3" aria-hidden="true" />
          Adjust
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Verify the file compiles**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit 2>&1 | grep query-confirmation-card`
Expected: No errors in this file. (Errors in `tool-result-renderer.tsx` and `page.tsx` are expected — fixed next.)

**Step 3: Commit**

```bash
git add src/components/data/query-confirmation-card.tsx
git commit -m "feat: replace raw text filter editor with FilterEditor in QueryConfirmationCard"
```

---

## Task 9: Update ToolResultRenderer

**Files:**
- Modify: `src/components/chat/tool-result-renderer.tsx`

**Step 1: Update the `onConfirmRun` prop type and callback**

Change `onConfirmRun` to pass `{ original, current }` structured filters from `QueryConfirmationCard`:

```tsx
"use client";

import type { CatalogResult, QueryResult } from "@/lib/socrata/api-client";
import type { QueryConfirmation, QueryFilter } from "@/types";
import { DatasetCardList } from "@/components/data/dataset-card-list";
import { DataTable } from "@/components/data/data-table";
import { QueryConfirmationCard } from "@/components/data/query-confirmation-card";

interface ToolResultRendererProps {
  toolName: string;
  output: unknown;
  onConfirmRun?: (filters: { original: QueryFilter[]; current: QueryFilter[] }) => void;
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
        onRun={(filters) => onConfirmRun?.(filters)}
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

**Step 2: Verify the file compiles**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit 2>&1 | grep tool-result-renderer`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/chat/tool-result-renderer.tsx
git commit -m "feat: update ToolResultRenderer to pass structured filters"
```

---

## Task 10: Update prop types through ChatMessage and ChatMessageList

**Files:**
- Modify: `src/components/chat/chat-message.tsx`
- Modify: `src/components/chat/chat-message-list.tsx`

**Step 1: Update ChatMessage props**

In `src/components/chat/chat-message.tsx`, change the `onConfirmRun` prop type:

```ts
// Before
onConfirmRun?: (confirmation: QueryConfirmation) => void;

// After
onConfirmRun?: (filters: { original: QueryFilter[]; current: QueryFilter[] }) => void;
```

Update the import to include `QueryFilter`:
```ts
import type { QueryConfirmation, QueryFilter } from "@/types";
```

The prop is passed through to `ToolResultRenderer` unchanged — no other modifications needed.

**Step 2: Update ChatMessageList props**

In `src/components/chat/chat-message-list.tsx`, change the `onConfirmRun` prop type:

```ts
// Before
onConfirmRun?: (confirmation: QueryConfirmation) => void;

// After
onConfirmRun?: (filters: { original: QueryFilter[]; current: QueryFilter[] }) => void;
```

Update imports to include `QueryFilter`:
```ts
import type { QueryConfirmation, QueryFilter } from "@/types";
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit 2>&1 | grep -E "(chat-message|chat-message-list)\.tsx"`
Expected: No errors in these files. (Errors may remain in `page.tsx` — fixed next.)

**Step 4: Commit**

```bash
git add src/components/chat/chat-message.tsx src/components/chat/chat-message-list.tsx
git commit -m "feat: thread structured filter types through chat message components"
```

---

## Task 11: Build the filter diff utility — tests first

**Files:**
- Create: `src/lib/__tests__/filter-diff.test.ts`
- Create: `src/lib/filter-diff.ts`

**Step 1: Write the failing test**

Create `src/lib/__tests__/filter-diff.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { composeFilterMessage } from "../filter-diff";
import type { QueryFilter } from "@/types";

describe("composeFilterMessage", () => {
  const base: QueryFilter[] = [
    { column: "results", operator: "=", value: "Fail", label: "results = 'Fail'" },
    { column: "date", operator: ">=", value: "2025-01-01", label: "date >= '2025-01-01'" },
  ];

  it("returns 'Go ahead, run it' when no changes", () => {
    expect(composeFilterMessage(base, [...base])).toBe("Go ahead, run it");
  });

  it("describes added filters", () => {
    const current = [
      ...base,
      { column: "ward", operator: "=", value: "44", label: "ward = '44'" },
    ];
    const msg = composeFilterMessage(base, current);
    expect(msg).toContain("ward = '44'");
    expect(msg).toContain("Add");
  });

  it("describes removed filters", () => {
    const current = [base[0]];
    const msg = composeFilterMessage(base, current);
    expect(msg).toContain("date >= '2025-01-01'");
    expect(msg).toContain("Remove");
  });

  it("describes changed values", () => {
    const current = [
      { ...base[0], value: "Pass", label: "results = 'Pass'" },
      base[1],
    ];
    const msg = composeFilterMessage(base, current);
    expect(msg).toContain("results = 'Pass'");
    expect(msg).toContain("Change");
  });

  it("handles all filters removed", () => {
    const msg = composeFilterMessage(base, []);
    expect(msg).toContain("Remove all filters");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run src/lib/__tests__/filter-diff.test.ts`
Expected: FAIL — module not found.

**Step 3: Write implementation**

Create `src/lib/filter-diff.ts`:

```ts
import type { QueryFilter } from "@/types";

function filterKey(f: QueryFilter): string {
  return `${f.column}|${f.operator}|${f.value}`;
}

export function composeFilterMessage(
  original: QueryFilter[],
  current: QueryFilter[]
): string {
  const origKeys = new Set(original.map(filterKey));
  const currKeys = new Set(current.map(filterKey));

  // No changes
  if (
    original.length === current.length &&
    original.every((f, i) => filterKey(f) === filterKey(current[i]))
  ) {
    return "Go ahead, run it";
  }

  // All removed
  if (current.length === 0) {
    return "Remove all filters and run the query.";
  }

  const parts: string[] = [];

  // Find changed filters (same column, different operator/value)
  const origByCol = new Map(original.map((f) => [f.column, f]));
  const currByCol = new Map(current.map((f) => [f.column, f]));

  for (const [col, curr] of currByCol) {
    const orig = origByCol.get(col);
    if (orig && filterKey(orig) !== filterKey(curr)) {
      parts.push(`Change ${col} filter to ${curr.label}`);
    }
  }

  // Find added filters (column not in original)
  for (const f of current) {
    if (!origByCol.has(f.column)) {
      parts.push(`Add filter: ${f.label}`);
    }
  }

  // Find removed filters (column not in current)
  for (const f of original) {
    if (!currByCol.has(f.column)) {
      parts.push(`Remove filter: ${f.label}`);
    }
  }

  if (parts.length === 0) {
    return "Go ahead, run it";
  }

  return `Run the query with these changes: ${parts.join(". ")}.`;
}
```

**Step 4: Run tests**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run src/lib/__tests__/filter-diff.test.ts`
Expected: PASS — all 5 tests green.

**Step 5: Commit**

```bash
git add src/lib/filter-diff.ts src/lib/__tests__/filter-diff.test.ts
git commit -m "feat: add filter diff utility for composing hybrid messages"
```

---

## Task 12: Update `page.tsx` — `handleConfirmRun`

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Simplify `handleConfirmRun`**

Replace the current `handleConfirmRun` with a clean version that uses `composeFilterMessage`:

```ts
// Add import at top:
import { composeFilterMessage } from "@/lib/filter-diff";
import type { QueryConfirmation, QueryFilter } from "@/types";

// Replace handleConfirmRun:
const handleConfirmRun = useCallback(
  (filters: { original: QueryFilter[]; current: QueryFilter[] }) => {
    const message = composeFilterMessage(filters.original, filters.current);
    sendMessage({ text: message });
  },
  [sendMessage]
);
```

Also remove the now-unused imports: `isToolUIPart`, `getToolName` — BUT check if they're used elsewhere in the file first (yes, they are used in the `export-results` shortcut effect). So keep those imports.

Remove `QueryConfirmation` from the import if no longer used — check: it's no longer referenced after this change. Remove it from the import line.

**Step 2: Update the ChatMessageList prop**

The `onConfirmRun` prop on `ChatMessageList` already accepts the new signature after Task 10.

**Step 3: Verify TypeScript compiles cleanly**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit`
Expected: Zero errors.

**Step 4: Run all tests**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npm test`
Expected: All tests pass.

**Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: simplify handleConfirmRun to use filter diff utility"
```

---

## Task 13: Dev server smoke test

**Step 1: Start the dev server**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npm run dev`

**Step 2: Manual verification checklist**

1. Page loads without console errors
2. Start a chat asking about a dataset (e.g. "Show me food inspection data")
3. Claude calls `confirm_query` — verify the confirmation card renders
4. Filters appear as clickable badges
5. Click a badge — it expands to column/operator/value dropdowns
6. Change a value, click "Run this query" — verify the composed message is sensible
7. Add a new filter via "Add filter" button — verify it works
8. Remove a filter via X — verify it's removed

**Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```

---

## Summary of all files changed

| File | Action | Task |
|------|--------|------|
| `vitest.config.ts` | Create | 1 |
| `src/test/setup.ts` | Create | 1 |
| `package.json` | Modify | 1, 2 |
| `src/components/ui/select.tsx` | Create | 2 |
| `src/lib/filter-operators.ts` | Create | 3 |
| `src/lib/__tests__/filter-operators.test.ts` | Create | 3 |
| `src/types/index.ts` | Modify | 4 |
| `src/lib/socrata/tools.ts` | Modify | 5 |
| `src/components/data/__tests__/filter-editor.test.tsx` | Create | 6 |
| `src/components/data/filter-editor.tsx` | Create | 7 |
| `src/components/data/query-confirmation-card.tsx` | Modify | 8 |
| `src/components/chat/tool-result-renderer.tsx` | Modify | 9 |
| `src/components/chat/chat-message.tsx` | Modify | 10 |
| `src/components/chat/chat-message-list.tsx` | Modify | 10 |
| `src/lib/__tests__/filter-diff.test.ts` | Create | 11 |
| `src/lib/filter-diff.ts` | Create | 11 |
| `src/app/page.tsx` | Modify | 12 |
