"use client";

import type { CatalogResult, QueryResult } from "@/lib/socrata/api-client";
import { DatasetCardList } from "@/components/data/dataset-card-list";
import { DataTable } from "@/components/data/data-table";

interface ToolResultRendererProps {
  toolName: string;
  output: unknown;
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

export function ToolResultRenderer({
  toolName,
  output,
}: ToolResultRendererProps) {
  if (toolName === "search_datasets" && isCatalogResults(output)) {
    return <DatasetCardList datasets={output} />;
  }

  if (toolName === "query_dataset" && isQueryResult(output)) {
    return <DataTable result={output} />;
  }

  // get_dataset_info and other tools: don't render
  return null;
}
