"use client";

import { useState } from "react";
import { Play, MessageSquare } from "lucide-react";
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

        <dt className="font-medium text-muted-foreground">Filters</dt>
        <dd>
          <FilterEditor
            filters={filters}
            availableColumns={confirmation.availableColumns}
            onChange={setFilters}
          />
        </dd>

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
