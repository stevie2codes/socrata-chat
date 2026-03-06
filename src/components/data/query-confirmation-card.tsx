"use client";

import { useState, useRef, useId } from "react";
import { Play, MessageSquare, Code, Info, ChevronDown, Plus, Filter } from "lucide-react";
import { FilterEditor } from "@/components/data/filter-editor";
import { cn } from "@/lib/utils";
import type { QueryConfirmation, QueryFilter, DatasetColumn } from "@/types";

/** Normalize filters from Claude — may arrive as string[] (old format) or QueryFilter[] (new). */
function normalizeFilters(raw: unknown): QueryFilter[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((f) => {
    if (typeof f === "string") {
      return { column: "", operator: "", value: "", label: f };
    }
    return f as QueryFilter;
  });
}

interface QueryConfirmationCardProps {
  confirmation: QueryConfirmation;
  toolCallId?: string;
  onRun: (filters: { original: QueryFilter[]; current: QueryFilter[] }) => void;
  onAdjust: () => void;
}

/* ── Collapsed summary shown after user confirms/adjusts ────────── */

interface QueryPlanSummaryProps {
  confirmation: QueryConfirmation;
  decision: "run" | "adjust";
}

export function QueryPlanSummary({ confirmation, decision }: QueryPlanSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const detailId = useId();

  if (decision === "adjust") {
    return (
      <div className="my-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground">
        <MessageSquare className="size-3 shrink-0" aria-hidden="true" />
        <span>Query adjusted</span>
      </div>
    );
  }

  return (
    <div className="my-2">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls={detailId}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground"
      >
        <Play className="size-3 shrink-0 text-primary/60" aria-hidden="true" />
        <span className="min-w-0 truncate text-left">
          {confirmation.estimatedDescription}
        </span>
        <span className="shrink-0 text-muted-foreground/60">
          &mdash; {confirmation.dataset.name}
        </span>
        <svg
          className={cn("ml-auto size-3 shrink-0 transition-transform", expanded && "rotate-90")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {expanded && (
        <div id={detailId} className="mt-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
            <dt className="font-medium text-muted-foreground">Dataset</dt>
            <dd className="text-foreground/80">{confirmation.dataset.name} ({confirmation.dataset.id})</dd>
            {confirmation.filters?.length > 0 && (
              <>
                <dt className="font-medium text-muted-foreground">Filters</dt>
                <dd className="text-foreground/80">
                  {normalizeFilters(confirmation.filters).map((f) => f.label).join(", ")}
                </dd>
              </>
            )}
          </dl>
          <pre className="mt-2 overflow-x-auto rounded bg-white/[0.03] px-2 py-1.5 font-mono text-[10px] text-foreground/70 whitespace-pre-wrap break-all">
            {confirmation.soql}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ── Full interactive card shown before user confirms ───────────── */

export function QueryConfirmationCard({
  confirmation,
  toolCallId,
  onRun,
  onAdjust,
}: QueryConfirmationCardProps) {
  const [acted, setActed] = useState(false);
  const [showSoql, setShowSoql] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const normalizedFilters = normalizeFilters(confirmation.filters);
  const availableColumns: DatasetColumn[] = confirmation.availableColumns ?? [];
  const [filters, setFilters] = useState<QueryFilter[]>(normalizedFilters);
  const addFilterRef = useRef<(() => void) | null>(null);

  const handleRun = () => {
    setActed(true);
    onRun({ original: normalizedFilters, current: filters });
  };

  const handleAdjust = () => {
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
        <h3 className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Query Plan
        </h3>

        <button
          type="button"
          onClick={() => setShowSoql((v) => !v)}
          aria-label={showSoql ? "Hide SoQL" : "View SoQL"}
          aria-expanded={showSoql}
          className={cn(
            "flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground",
            showSoql && "bg-white/[0.08] text-foreground"
          )}
        >
          <Code className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Description */}
      <p className="mb-4 text-sm text-foreground/90">
        {confirmation.estimatedDescription}
      </p>

      {/* Methodology */}
      {confirmation.methodology && (
        <div className="mb-4 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5">
          <p className="text-xs leading-relaxed text-foreground/80">
            {confirmation.methodology}
          </p>
        </div>
      )}

      {/* Dataset metadata — compact inline */}
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
        <span>
          <span className="font-medium text-muted-foreground">Dataset </span>
          <span className="text-foreground">{confirmation.dataset.name}</span>
          <span className="text-muted-foreground"> ({confirmation.dataset.id})</span>
        </span>
        <span>
          <span className="font-medium text-muted-foreground">Rows </span>
          <span className="text-foreground">{formatRowCount(confirmation.dataset.rowCount)}</span>
        </span>
        {confirmation.columns.length > 0 && (
          <span className="basis-full">
            <span className="font-medium text-muted-foreground">Columns </span>
            <span className="text-foreground">{confirmation.columns.join(", ")}</span>
          </span>
        )}
      </div>

      {/* Filters section — dedicated interactive area */}
      <div className="mb-4 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3.5 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Filter className="size-3 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-medium text-muted-foreground">Filters</span>
            {filters.length > 0 && (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {filters.length}
              </span>
            )}
          </div>
          <button
            onClick={() => addFilterRef.current?.()}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            aria-label="Add filter"
          >
            <Plus className="size-3" aria-hidden="true" />
            Add
          </button>
        </div>
        <FilterEditor
          filters={filters}
          availableColumns={availableColumns}
          onChange={setFilters}
          onAddRef={addFilterRef}
        />
        {filters.length === 0 && (
          <p className="mt-1 text-xs text-muted-foreground/60">No filters applied</p>
        )}
      </div>

      {/* Technical details — standalone collapsible */}
      {confirmation.technicalNotes && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowTechnical((v) => !v)}
            aria-label={showTechnical ? "Hide technical details" : "Show technical details"}
            aria-expanded={showTechnical}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
              "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
              showTechnical && "bg-white/[0.03] text-foreground"
            )}
          >
            <Info className="size-3.5" aria-hidden="true" />
            Technical details
            <ChevronDown
              className={cn("ml-auto size-3.5 transition-transform", showTechnical && "rotate-180")}
              aria-hidden="true"
            />
          </button>
          {showTechnical && (
            <div className="mt-1 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
              <dl className="space-y-3 text-xs">
                {confirmation.technicalNotes.columnMappings.length > 0 && (
                  <div>
                    <dt className="mb-1 font-medium text-muted-foreground">Columns used</dt>
                    <dd className="space-y-1">
                      {confirmation.technicalNotes.columnMappings.map((m, i) => (
                        <p key={i} className="text-foreground/70">
                          <code className="rounded bg-white/[0.06] px-1 py-0.5 font-mono text-[11px]">{m.fieldName}</code>
                          {" "}&mdash; {m.rationale}
                        </p>
                      ))}
                    </dd>
                  </div>
                )}
                {confirmation.technicalNotes.assumptions.length > 0 && (
                  <div>
                    <dt className="mb-1 font-medium text-muted-foreground">Assumptions</dt>
                    <dd>
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
                    <dt className="mb-1 font-medium text-muted-foreground">Exclusions</dt>
                    <dd>
                      <ul className="list-inside list-disc text-foreground/70">
                        {confirmation.technicalNotes.exclusions.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      )}

      {/* SoQL reveal */}
      {showSoql && (
        <pre className="mb-4 overflow-x-auto rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2.5 font-mono text-xs text-foreground/90 whitespace-pre-wrap break-all">
          {confirmation.soql}
        </pre>
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
