"use client";

import type { QueryFilter } from "@/types";

interface SidebarFiltersSectionProps {
  filters: QueryFilter[];
  onRemove: (index: number) => void;
}

export function SidebarFiltersSection({
  filters,
  onRemove,
}: SidebarFiltersSectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Filters
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {filters.map((filter, i) => (
          <span
            key={i}
            className="glass-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-foreground/80"
          >
            {filter.label}
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Remove filter: ${filter.label}`}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}
