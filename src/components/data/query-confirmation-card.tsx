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
          onClick={editingFilters ? handleApplyAndRun : handleRun}
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
