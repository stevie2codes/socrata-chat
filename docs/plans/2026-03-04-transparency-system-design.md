# Unified Transparency System

**Date:** 2026-03-04
**Status:** Approved

## Problem

Report builders using public data need to trust and cite the numbers this tool produces. Currently the AI's reasoning is invisible, and results carry no provenance metadata. A journalist, analyst, or city official can't confidently publish a number without knowing:

1. How the AI interpreted their question (pre-execution)
2. Where the data came from and how to verify it (post-execution)

## Design

### Two Trust Moments

The system addresses transparency at two critical points in the user's workflow.

---

### 1. Pre-execution: Enhanced Query Plan Card

The existing `QueryConfirmationCard` gains two new tiered sections, designed for different audience levels.

#### Plain-English methodology (always visible)

A 1-2 sentence summary explaining the AI's interpretation and approach:

> "Counting rows where inspection result is 'Fail', grouped by month using the inspection_date column."

This surfaces interpretation errors before the query runs — the most valuable moment to catch them.

#### Technical details (expandable toggle)

A collapsible section (same pattern as the SoQL viewer) showing:

- **Column mappings** — Which dataset columns map to which parts of the query
- **Assumptions** — Date range inferred, null handling, default sort order
- **Exclusions** — What data is filtered out and approximate impact (e.g., "~2.3% of rows have null results and are excluded")

#### Schema changes to `confirm_query`

New fields added to the tool's input schema:

```typescript
methodology: z.string()
  .describe("1-2 sentence plain-English explanation of the approach and interpretation")

technicalNotes: z.object({
  columnMappings: z.array(z.object({
    intent: z.string(),       // e.g. "inspection date"
    fieldName: z.string(),    // e.g. "inspection_date"
    rationale: z.string(),    // e.g. "calendar_date column most relevant to inspection timing"
  })),
  assumptions: z.array(z.string()),  // e.g. ["No date range specified — querying all available data"]
  exclusions: z.array(z.string()),   // e.g. ["~2.3% of rows have null results and are excluded"]
})
```

#### System prompt additions

Instruct Claude to:
- Explain its interpretation of the user's question in `methodology`
- Be explicit about column choices, especially when multiple candidates exist
- Note any assumptions about date ranges, aggregation methods, or null handling
- Estimate the impact of exclusions when possible

---

### 2. Post-execution: Provenance Footer

After query results render (`DataTable` or charts), a `ProvenanceFooter` component appears below with low-emphasis styling.

#### Content

- **Source** — Dataset name linked to the portal permalink, with the dataset's last-updated date
- **Query metadata** — Timestamp when the query ran, rows returned vs. total rows in dataset, whether LIMIT was applied (with a note that results may be partial)
- **Verification links:**
  - **SODA API URL** — Direct `https://{domain}/resource/{id}.json?$query={soql}` link for independent verification in a browser
  - **App permalink** — Shareable link that reopens this query context in the chat app (future scope — may require URL-based state)

#### Data requirements

`query_dataset` response needs enrichment:
- `queryTimestamp` — When the query executed (set client-side or server-side)
- `datasetLastUpdated` — From dataset metadata (already available via `get_dataset_info`)
- `sodaApiUrl` — Constructed from domain + datasetId + soql

Some of this can be assembled client-side from data already in the conversation context (active dataset metadata, the soql from `confirm_query`, etc.) rather than requiring server changes.

---

### Data Flow

```
User question
  → Claude interprets (generates methodology + technicalNotes + soql)
  → confirm_query returns all fields to UI
  → QueryConfirmationCard renders:
      - methodology (always visible)
      - technical details toggle
      - SoQL toggle (existing)
      - filters, columns, etc. (existing)
  → User confirms → query_dataset runs
  → Results render with DataTable
  → ProvenanceFooter renders below with source, timestamps, verification links
```

---

## UI Components

### Modified
- `QueryConfirmationCard` — Add methodology display + technical details toggle
- `QueryConfirmation` type — Add `methodology` and `technicalNotes` fields
- `confirm_query` tool — Add new schema fields
- System prompt — Add transparency instructions

### New
- `ProvenanceFooter` — Rendered below `DataTable` in `ToolResultRenderer`
- Follows existing `glass-subtle` styling, low visual weight

---

## Styling

- Methodology text: `text-sm text-foreground/80`, sits between description and details grid
- Technical details toggle: Same pattern as SoQL viewer — icon button in header, collapsible section
- Provenance footer: `glass-subtle` with `text-xs text-muted-foreground`, subtle border-top separator
- Verification links: Understated link styling, not primary CTAs

## Open Questions

- **App permalink scope:** Full shareable-link support may require URL-based state management. Could ship SODA API URL first and add app permalink later.
- **Data freshness:** Socrata metadata includes `rowsUpdatedAt` — should we show this as "Data last updated: X" or just link to the portal page?
- **Exclusion estimation:** Getting null percentages requires an extra query. Worth it, or just note "rows with null values are excluded" without a percentage?
