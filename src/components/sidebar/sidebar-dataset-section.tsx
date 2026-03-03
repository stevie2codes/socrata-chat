"use client";

import { useState } from "react";
import type { SocrataDataset } from "@/types";

const INITIAL_COLUMNS = 8;

interface SidebarDatasetSectionProps {
  dataset: SocrataDataset;
}

export function SidebarDatasetSection({ dataset }: SidebarDatasetSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const columns = showAll
    ? dataset.columns
    : dataset.columns.slice(0, INITIAL_COLUMNS);
  const hasMore = dataset.columns.length > INITIAL_COLUMNS;

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Dataset
      </h3>
      <p className="text-sm font-medium text-foreground/90">{dataset.name}</p>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span>{dataset.rowCount.toLocaleString()} rows</span>
        <span>{dataset.columns.length} columns</span>
      </div>

      <dl className="mt-2 space-y-1">
        {columns.map((col) => (
          <div key={col.fieldName} className="flex items-baseline justify-between gap-2">
            <dt className="truncate font-mono text-xs text-foreground/80">
              {col.fieldName}
            </dt>
            <dd className="shrink-0 text-[10px] text-muted-foreground">
              {col.dataType}
            </dd>
          </div>
        ))}
      </dl>

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          {showAll
            ? "Show fewer"
            : `Show all ${dataset.columns.length} columns`}
        </button>
      )}
    </section>
  );
}
