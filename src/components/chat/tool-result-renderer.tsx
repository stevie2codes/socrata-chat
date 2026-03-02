"use client";

import type { CatalogResult, QueryResult } from "@/lib/socrata/api-client";

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
    // Will be replaced by DatasetCardList in Task 3
    return (
      <div className="my-3 text-xs text-muted-foreground">
        {output.length} dataset{output.length !== 1 ? "s" : ""} found
      </div>
    );
  }

  if (toolName === "query_dataset" && isQueryResult(output)) {
    // Will be replaced by DataTable in Task 4
    return (
      <div className="my-3 text-xs text-muted-foreground">
        {output.totalRows} row{output.totalRows !== 1 ? "s" : ""} returned in{" "}
        {output.executionTimeMs}ms
      </div>
    );
  }

  // get_dataset_info and other tools: don't render
  return null;
}
