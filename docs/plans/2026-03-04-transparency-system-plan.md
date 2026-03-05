# Transparency System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add pre-execution AI reasoning and post-execution provenance metadata so report builders can trust and cite query results.

**Architecture:** Two layers — (1) `confirm_query` tool gains `methodology` and `technicalNotes` fields that the LLM populates, rendered in `QueryConfirmationCard` as tiered disclosure; (2) `query_dataset` tool output is enriched with provenance metadata (domain, datasetId, sodaApiUrl), rendered by a new `ProvenanceFooter` component below `DataTable`.

**Tech Stack:** TypeScript, Zod (tool schemas), Vitest + React Testing Library (tests), Tailwind CSS v4 (styling)

---

## Task 1: Add methodology + technicalNotes types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Write the type additions**

Add these interfaces and update `QueryConfirmation`:

```typescript
// Add after QueryFilter interface (~line 38)

export interface ColumnMapping {
  intent: string;
  fieldName: string;
  rationale: string;
}

export interface TechnicalNotes {
  columnMappings: ColumnMapping[];
  assumptions: string[];
  exclusions: string[];
}
```

Update `QueryConfirmation` to add two new optional fields:

```typescript
export interface QueryConfirmation {
  dataset: {
    name: string;
    id: string;
    domain: string;
    rowCount: number;
  };
  soql: string;
  filters: QueryFilter[];
  columns: string[];
  estimatedDescription: string;
  availableColumns: DatasetColumn[];
  methodology?: string;
  technicalNotes?: TechnicalNotes;
}
```

**Step 2: Verify types compile**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add methodology and technicalNotes types to QueryConfirmation"
```

---

## Task 2: Update confirm_query tool schema

**Files:**
- Modify: `src/lib/socrata/tools.ts:157-204`

**Step 1: Add methodology and technicalNotes to the zod schema**

In the `confirm_query` tool definition, add after the `availableColumns` field:

```typescript
    methodology: z
      .string()
      .describe(
        "1-2 sentence plain-English explanation of how you interpreted the user's question " +
        "and what this query measures. Example: 'Counting rows where inspection result is Fail, " +
        "grouped by month using the inspection_date column.'"
      ),
    technicalNotes: z
      .object({
        columnMappings: z
          .array(
            z.object({
              intent: z.string().describe('What this column represents in the query, e.g. "inspection date"'),
              fieldName: z.string().describe("The dataset fieldName used"),
              rationale: z.string().describe("Why this column was chosen over alternatives"),
            })
          )
          .describe("Key columns used and why they were selected"),
        assumptions: z
          .array(z.string())
          .describe(
            'Assumptions made about the query, e.g. "No date range specified — querying all available data"'
          ),
        exclusions: z
          .array(z.string())
          .describe(
            'Data excluded by this query, e.g. "Rows with null results are excluded by the WHERE clause"'
          ),
      })
      .optional()
      .describe("Technical details for power users — column choices, assumptions, and exclusions"),
```

Also update the tool description to mention methodology:

```typescript
  description:
    "Present a query plan to the user for confirmation before executing. " +
    "Call this BEFORE query_dataset when this is the first query in the conversation " +
    "or when switching to a different dataset. Skip this tool for follow-up " +
    "refinements on the same dataset. The tool returns the plan for the UI to render " +
    "as an interactive confirmation card. " +
    "IMPORTANT: filters must be structured objects with column, operator, value, and label. " +
    "availableColumns should include all columns from the dataset schema (from get_dataset_info). " +
    "Always include a methodology explaining your interpretation of the user's question.",
```

**Step 2: Verify types compile**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/socrata/tools.ts
git commit -m "feat: add methodology and technicalNotes to confirm_query schema"
```

---

## Task 3: Update system prompt for transparency

**Files:**
- Modify: `src/lib/prompts/system-prompt.ts:53-89` (buildToolInstructionsSection)

**Step 1: Add transparency instructions to confirm_query section**

In `buildToolInstructionsSection`, replace the `### confirm_query` section with:

```typescript
### confirm_query
- Call this **before** \`query_dataset\` when: (a) this is the first query in the conversation, OR (b) you are querying a different dataset than the one in the Current Context section.
- **Skip** this tool when the user is refining, filtering, or re-querying the same active dataset.
- Fill in all fields: dataset info, the SoQL you plan to run, human-readable filter descriptions, the columns you'll return, and a one-sentence description.
- **methodology** (required): Explain in 1-2 sentences how you interpreted the user's question and what this query measures. Be specific about what you're counting, summing, or filtering. If the user's question was ambiguous, state which interpretation you chose.
- **technicalNotes** (optional but encouraged): Include column mappings (which columns you chose and why, especially if alternatives existed), assumptions (date ranges inferred, default sort, null handling), and exclusions (what data is filtered out). This helps power users verify correctness.
- After calling this tool, **stop and wait** for the user to confirm. Do NOT call \`query_dataset\` in the same turn.
```

**Step 2: Verify the prompt reads correctly**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/prompts/system-prompt.ts
git commit -m "feat: add transparency instructions to system prompt for methodology and technicalNotes"
```

---

## Task 4: Update QueryConfirmationCard with methodology display

**Files:**
- Modify: `src/components/data/query-confirmation-card.tsx`
- Test: `src/components/data/__tests__/query-confirmation-card.test.tsx` (new)

**Step 1: Write the failing tests**

Create `src/components/data/__tests__/query-confirmation-card.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryConfirmationCard } from "@/components/data/query-confirmation-card";
import type { QueryConfirmation } from "@/types";

const baseConfirmation: QueryConfirmation = {
  dataset: { name: "Food Inspections", id: "4ijn-s7e5", domain: "data.cityofchicago.org", rowCount: 234000 },
  soql: "SELECT * WHERE results = 'Fail' ORDER BY date DESC LIMIT 100",
  filters: [{ column: "results", operator: "=", value: "Fail", label: "results = 'Fail'" }],
  columns: ["dba_name", "results", "inspection_date"],
  estimatedDescription: "Show all failed food inspections",
  availableColumns: [
    { fieldName: "dba_name", name: "DBA Name", dataType: "text" },
    { fieldName: "results", name: "Results", dataType: "text" },
    { fieldName: "inspection_date", name: "Inspection Date", dataType: "calendar_date" },
  ],
};

const noop = () => {};

describe("QueryConfirmationCard methodology", () => {
  it("renders methodology text when provided", () => {
    const confirmation: QueryConfirmation = {
      ...baseConfirmation,
      methodology: "Counting failed inspections filtered by results column.",
    };
    render(<QueryConfirmationCard confirmation={confirmation} onRun={noop} onAdjust={noop} />);
    expect(screen.getByText(/Counting failed inspections/)).toBeInTheDocument();
  });

  it("does not render methodology section when not provided", () => {
    render(<QueryConfirmationCard confirmation={baseConfirmation} onRun={noop} onAdjust={noop} />);
    expect(screen.queryByText(/Methodology/i)).not.toBeInTheDocument();
  });

  it("renders technical details toggle when technicalNotes provided", async () => {
    const user = userEvent.setup();
    const confirmation: QueryConfirmation = {
      ...baseConfirmation,
      methodology: "Counting failed inspections.",
      technicalNotes: {
        columnMappings: [{ intent: "inspection result", fieldName: "results", rationale: "Direct match for pass/fail status" }],
        assumptions: ["No date range specified — querying all available data"],
        exclusions: ["Rows with null results are excluded"],
      },
    };
    render(<QueryConfirmationCard confirmation={confirmation} onRun={noop} onAdjust={noop} />);

    // Technical details not visible by default
    expect(screen.queryByText(/Direct match for pass/)).not.toBeInTheDocument();

    // Click toggle to reveal
    const toggle = screen.getByRole("button", { name: /technical details/i });
    await user.click(toggle);

    expect(screen.getByText(/Direct match for pass/)).toBeInTheDocument();
    expect(screen.getByText(/No date range specified/)).toBeInTheDocument();
    expect(screen.getByText(/Rows with null results/)).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run src/components/data/__tests__/query-confirmation-card.test.tsx`
Expected: FAIL — tests reference methodology rendering that doesn't exist yet

**Step 3: Implement the methodology display in QueryConfirmationCard**

Add a `showTechnical` state and an `Info` icon import:

```typescript
import { Play, MessageSquare, Code, Info } from "lucide-react";
```

```typescript
const [showTechnical, setShowTechnical] = useState(false);
```

After the `{/* Description */}` section and before `{/* Details grid */}`, add:

```tsx
      {/* Methodology */}
      {confirmation.methodology && (
        <div className="mb-4 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
          <p className="text-xs leading-relaxed text-foreground/80">
            {confirmation.methodology}
          </p>
          {confirmation.technicalNotes && (
            <>
              <button
                type="button"
                onClick={() => setShowTechnical((v) => !v)}
                aria-label={showTechnical ? "Hide technical details" : "Show technical details"}
                aria-expanded={showTechnical}
                className="mt-2 flex items-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Info className="size-3" aria-hidden="true" />
                Technical details
                <svg
                  className={cn("size-2.5 transition-transform", showTechnical && "rotate-180")}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showTechnical && (
                <dl className="mt-2 space-y-2 text-[11px]">
                  {confirmation.technicalNotes.columnMappings.length > 0 && (
                    <div>
                      <dt className="font-medium text-muted-foreground">Columns used</dt>
                      <dd className="mt-0.5 space-y-0.5">
                        {confirmation.technicalNotes.columnMappings.map((m, i) => (
                          <p key={i} className="text-foreground/70">
                            <code className="rounded bg-glass px-1 py-0.5 font-mono text-[10px]">{m.fieldName}</code>
                            {" "}— {m.rationale}
                          </p>
                        ))}
                      </dd>
                    </div>
                  )}
                  {confirmation.technicalNotes.assumptions.length > 0 && (
                    <div>
                      <dt className="font-medium text-muted-foreground">Assumptions</dt>
                      <dd className="mt-0.5">
                        <ul className="list-inside list-disc text-foreground/70">
                          {confirmation.technicalNotes.assumptions.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                  {confirmation.technicalNotes.exclusions.length > 0 && (
                    <div>
                      <dt className="font-medium text-muted-foreground">Exclusions</dt>
                      <dd className="mt-0.5">
                        <ul className="list-inside list-disc text-foreground/70">
                          {confirmation.technicalNotes.exclusions.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                </dl>
              )}
            </>
          )}
        </div>
      )}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run src/components/data/__tests__/query-confirmation-card.test.tsx`
Expected: PASS

**Step 5: Run all tests to check for regressions**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/components/data/query-confirmation-card.tsx src/components/data/__tests__/query-confirmation-card.test.tsx
git commit -m "feat: add methodology and technical details display to QueryConfirmationCard"
```

---

## Task 5: Build SODA URL helper + tests

**Files:**
- Create: `src/lib/utils/soda-url.ts`
- Create: `src/lib/__tests__/soda-url.test.ts`

**Step 1: Write the failing tests**

Create `src/lib/__tests__/soda-url.test.ts`:

```typescript
import { buildSodaApiUrl, buildPortalPermalink } from "@/lib/utils/soda-url";

describe("buildSodaApiUrl", () => {
  it("builds a valid SODA API URL", () => {
    const url = buildSodaApiUrl(
      "data.cityofchicago.org",
      "4ijn-s7e5",
      "SELECT * WHERE results = 'Fail' LIMIT 100"
    );
    expect(url).toBe(
      "https://data.cityofchicago.org/resource/4ijn-s7e5.json?$query=SELECT%20*%20WHERE%20results%20%3D%20'Fail'%20LIMIT%20100"
    );
  });

  it("handles special characters in SoQL", () => {
    const url = buildSodaApiUrl(
      "data.cityofchicago.org",
      "4ijn-s7e5",
      "SELECT count(*) WHERE name LIKE '%test%'"
    );
    expect(url).toContain("$query=");
    // URL should be valid and decodable
    const parsed = new URL(url);
    expect(parsed.searchParams.get("$query")).toBe("SELECT count(*) WHERE name LIKE '%test%'");
  });
});

describe("buildPortalPermalink", () => {
  it("builds a portal dataset permalink", () => {
    const url = buildPortalPermalink("data.cityofchicago.org", "4ijn-s7e5");
    expect(url).toBe("https://data.cityofchicago.org/d/4ijn-s7e5");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run src/lib/__tests__/soda-url.test.ts`
Expected: FAIL — module not found

**Step 3: Implement the helper**

Create `src/lib/utils/soda-url.ts`:

```typescript
/** Build a direct SODA API URL for independent verification of query results. */
export function buildSodaApiUrl(domain: string, datasetId: string, soql: string): string {
  const params = new URLSearchParams({ $query: soql });
  return `https://${domain}/resource/${datasetId}.json?${params}`;
}

/** Build a link to the dataset's page on the Socrata portal. */
export function buildPortalPermalink(domain: string, datasetId: string): string {
  return `https://${domain}/d/${datasetId}`;
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run src/lib/__tests__/soda-url.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/utils/soda-url.ts src/lib/__tests__/soda-url.test.ts
git commit -m "feat: add SODA API URL and portal permalink helpers"
```

---

## Task 6: Enrich QueryResult with provenance data

**Files:**
- Modify: `src/lib/socrata/api-client.ts` (QueryResult type + queryDataset function)
- Modify: `src/lib/socrata/tools.ts` (query_dataset tool to pass through provenance)

**Step 1: Extend the QueryResult type**

In `src/lib/socrata/api-client.ts`, update the `QueryResult` interface:

```typescript
export interface QueryResult {
  data: Record<string, unknown>[];
  totalRows: number;
  query: string;
  executionTimeMs: number;
  provenance?: {
    domain: string;
    datasetId: string;
    sodaApiUrl: string;
    portalPermalink: string;
    queryTimestamp: string;
  };
}
```

**Step 2: Update queryDataset to populate provenance**

In the `queryDataset` function, add the import and update the return:

```typescript
import { buildSodaApiUrl, buildPortalPermalink } from "@/lib/utils/soda-url";
```

Update the return block at the end of `queryDataset`:

```typescript
  return {
    data,
    totalRows: data.length,
    query: cleaned,
    executionTimeMs,
    provenance: {
      domain,
      datasetId,
      sodaApiUrl: buildSodaApiUrl(domain, datasetId, cleaned),
      portalPermalink: buildPortalPermalink(domain, datasetId),
      queryTimestamp: new Date().toISOString(),
    },
  };
```

**Step 3: Verify types compile**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit`
Expected: No errors

**Step 4: Run all tests**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/lib/socrata/api-client.ts
git commit -m "feat: enrich QueryResult with provenance metadata"
```

---

## Task 7: Create ProvenanceFooter component + tests

**Files:**
- Create: `src/components/data/provenance-footer.tsx`
- Create: `src/components/data/__tests__/provenance-footer.test.tsx`

**Step 1: Write the failing tests**

Create `src/components/data/__tests__/provenance-footer.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { ProvenanceFooter } from "@/components/data/provenance-footer";

const provenance = {
  domain: "data.cityofchicago.org",
  datasetId: "4ijn-s7e5",
  sodaApiUrl: "https://data.cityofchicago.org/resource/4ijn-s7e5.json?$query=SELECT%20*",
  portalPermalink: "https://data.cityofchicago.org/d/4ijn-s7e5",
  queryTimestamp: "2026-03-04T12:00:00.000Z",
};

describe("ProvenanceFooter", () => {
  it("renders the portal domain as a link", () => {
    render(<ProvenanceFooter provenance={provenance} totalRows={50} limitApplied={false} />);
    const link = screen.getByRole("link", { name: /data\.cityofchicago\.org/i });
    expect(link).toHaveAttribute("href", provenance.portalPermalink);
  });

  it("renders the dataset ID", () => {
    render(<ProvenanceFooter provenance={provenance} totalRows={50} limitApplied={false} />);
    expect(screen.getByText(/4ijn-s7e5/)).toBeInTheDocument();
  });

  it("renders the query timestamp", () => {
    render(<ProvenanceFooter provenance={provenance} totalRows={50} limitApplied={false} />);
    // Should show some formatted time
    expect(screen.getByText(/queried/i)).toBeInTheDocument();
  });

  it("shows a limit warning when limitApplied is true", () => {
    render(<ProvenanceFooter provenance={provenance} totalRows={100} limitApplied={true} />);
    expect(screen.getByText(/results may be partial/i)).toBeInTheDocument();
  });

  it("does not show limit warning when limitApplied is false", () => {
    render(<ProvenanceFooter provenance={provenance} totalRows={50} limitApplied={false} />);
    expect(screen.queryByText(/results may be partial/i)).not.toBeInTheDocument();
  });

  it("renders the SODA API verification link", () => {
    render(<ProvenanceFooter provenance={provenance} totalRows={50} limitApplied={false} />);
    const link = screen.getByRole("link", { name: /verify/i });
    expect(link).toHaveAttribute("href", provenance.sodaApiUrl);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run src/components/data/__tests__/provenance-footer.test.tsx`
Expected: FAIL — module not found

**Step 3: Implement ProvenanceFooter**

Create `src/components/data/provenance-footer.tsx`:

```tsx
import { ExternalLink } from "lucide-react";

interface Provenance {
  domain: string;
  datasetId: string;
  sodaApiUrl: string;
  portalPermalink: string;
  queryTimestamp: string;
}

interface ProvenanceFooterProps {
  provenance: Provenance;
  totalRows: number;
  limitApplied: boolean;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function ProvenanceFooter({ provenance, totalRows, limitApplied }: ProvenanceFooterProps) {
  return (
    <div className="mt-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] text-muted-foreground">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          Source:{" "}
          <a
            href={provenance.portalPermalink}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground"
          >
            {provenance.domain}
          </a>
          {" "}
          <span className="text-muted-foreground/60">({provenance.datasetId})</span>
        </span>

        <span className="text-muted-foreground/30">|</span>

        <span>
          Queried {formatTimestamp(provenance.queryTimestamp)} &middot; {totalRows.toLocaleString()}{" "}
          {totalRows === 1 ? "row" : "rows"}
        </span>

        {limitApplied && (
          <>
            <span className="text-muted-foreground/30">|</span>
            <span className="text-amber-400/80">Results may be partial (LIMIT applied)</span>
          </>
        )}

        <span className="text-muted-foreground/30">|</span>

        <a
          href={provenance.sodaApiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 transition-colors hover:text-foreground"
        >
          Verify via SODA API
          <ExternalLink className="size-2.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run src/components/data/__tests__/provenance-footer.test.tsx`
Expected: PASS

**Step 5: Run all tests**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run`
Expected: All PASS

**Step 6: Commit**

```bash
git add src/components/data/provenance-footer.tsx src/components/data/__tests__/provenance-footer.test.tsx
git commit -m "feat: create ProvenanceFooter component with source, timestamp, and verification link"
```

---

## Task 8: Wire ProvenanceFooter into ToolResultRenderer

**Files:**
- Modify: `src/components/chat/tool-result-renderer.tsx`

**Step 1: Import ProvenanceFooter and update the query_dataset rendering**

Add the import:

```typescript
import { ProvenanceFooter } from "@/components/data/provenance-footer";
```

Replace the `query_dataset` block:

```typescript
  if (toolName === "query_dataset" && isQueryResult(output)) {
    const limitApplied = output.data.length >= 100 && !output.query.match(/LIMIT\s+\d+/i);
    return (
      <>
        <DataTable result={output} />
        {output.provenance && (
          <ProvenanceFooter
            provenance={output.provenance}
            totalRows={output.totalRows}
            limitApplied={limitApplied}
          />
        )}
      </>
    );
  }
```

Note: The `limitApplied` heuristic checks if results hit the 100-row default and no explicit LIMIT was in the query. This is imperfect but good enough — the SODA API URL lets users verify independently.

**Step 2: Verify types compile**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx tsc --noEmit`
Expected: No errors

**Step 3: Run all tests**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run`
Expected: All PASS

**Step 4: Commit**

```bash
git add src/components/chat/tool-result-renderer.tsx
git commit -m "feat: wire ProvenanceFooter into ToolResultRenderer for query results"
```

---

## Task 9: Manual integration test

This task validates the full flow end-to-end with the running app.

**Step 1: Start the dev server**

Run: `cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npm run dev`

**Step 2: Test pre-execution transparency**

1. Ask a question like "What are the most common food inspection violations in Chicago?"
2. Verify the confirmation card shows:
   - The description (existing)
   - A methodology sentence explaining the AI's interpretation
   - A "Technical details" toggle (if Claude provided technicalNotes)
   - Click the toggle — verify column mappings, assumptions, exclusions render
   - The SoQL viewer toggle (existing) still works

**Step 3: Test post-execution provenance**

1. Click "Run this query" on the confirmation card
2. After results load, verify below the DataTable:
   - Source link pointing to the portal dataset page
   - Dataset ID shown
   - Query timestamp
   - "Verify via SODA API" link that opens a valid JSON response in a new tab
3. If results are 100+ rows, verify the "Results may be partial" warning appears

**Step 4: Final commit and push**

Run all tests one more time:
```bash
cd /Users/stevie2toes/workspace/socrata-chat/socrata-chat && npx vitest run
```

If all pass, the feature is complete.

---

## Summary of all files touched

**Modified:**
- `src/types/index.ts` — Add ColumnMapping, TechnicalNotes interfaces; update QueryConfirmation
- `src/lib/socrata/tools.ts` — Add methodology + technicalNotes to confirm_query schema
- `src/lib/socrata/api-client.ts` — Add provenance to QueryResult; enrich queryDataset output
- `src/lib/prompts/system-prompt.ts` — Add transparency instructions for confirm_query
- `src/components/data/query-confirmation-card.tsx` — Methodology display + technical details toggle
- `src/components/chat/tool-result-renderer.tsx` — Wire ProvenanceFooter after DataTable

**Created:**
- `src/lib/utils/soda-url.ts` — SODA API URL + portal permalink helpers
- `src/lib/__tests__/soda-url.test.ts` — Tests for URL helpers
- `src/components/data/provenance-footer.tsx` — Provenance footer component
- `src/components/data/__tests__/provenance-footer.test.tsx` — Tests for ProvenanceFooter
- `src/components/data/__tests__/query-confirmation-card.test.tsx` — Tests for methodology display
