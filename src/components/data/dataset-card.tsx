"use client";

import { ExternalLink, Rows3, Columns3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CatalogResult } from "@/lib/socrata/api-client";

interface DatasetCardProps {
  dataset: CatalogResult;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function DatasetCard({ dataset }: DatasetCardProps) {
  const categories = dataset.category.slice(0, 2);

  return (
    <article
      role="article"
      aria-label={`Dataset: ${dataset.name}`}
      className="glass-subtle rounded-xl px-4 py-3 transition-colors hover:bg-glass-highlight/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            {dataset.name}
          </h3>

          {dataset.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {dataset.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="secondary"
              className="gap-1 text-[10px] font-normal"
            >
              <Rows3 className="size-3" aria-hidden="true" />
              {formatNumber(dataset.rows)} rows
            </Badge>

            <Badge
              variant="secondary"
              className="gap-1 text-[10px] font-normal"
            >
              <Columns3 className="size-3" aria-hidden="true" />
              {dataset.columns} cols
            </Badge>

            {categories.map((cat) => (
              <Badge
                key={cat}
                variant="outline"
                className="text-[10px] font-normal"
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {dataset.permalink && (
          <a
            href={dataset.permalink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${dataset.name} on Socrata (new tab)`}
            className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
}
