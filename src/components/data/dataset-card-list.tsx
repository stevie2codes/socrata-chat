"use client";

import type { CatalogResult } from "@/lib/socrata/api-client";
import { DatasetCard } from "@/components/data/dataset-card";

interface DatasetCardListProps {
  datasets: CatalogResult[];
}

export function DatasetCardList({ datasets }: DatasetCardListProps) {
  if (datasets.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="mb-2 text-xs text-muted-foreground">
        {datasets.length} dataset{datasets.length !== 1 ? "s" : ""} found
      </p>

      <div className="flex flex-col gap-2">
        {datasets.map((dataset) => (
          <DatasetCard key={dataset.id} dataset={dataset} />
        ))}
      </div>
    </div>
  );
}
