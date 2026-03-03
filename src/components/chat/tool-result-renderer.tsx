"use client";

import type { CatalogResult, QueryResult } from "@/lib/socrata/api-client";
import type { QueryConfirmation } from "@/types";
import { DatasetCardList } from "@/components/data/dataset-card-list";
import { DataTable } from "@/components/data/data-table";
import { QueryConfirmationCard } from "@/components/data/query-confirmation-card";

interface ToolResultRendererProps {
  toolName: string;
  output: unknown;
  onConfirmRun?: (confirmation: QueryConfirmation) => void;
  onConfirmAdjust?: () => void;
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

function isQueryConfirmation(output: unknown): output is QueryConfirmation {
  return (
    typeof output === "object" &&
    output !== null &&
    "soql" in output &&
    "dataset" in output &&
    "estimatedDescription" in output
  );
}

export function ToolResultRenderer({
  toolName,
  output,
  onConfirmRun,
  onConfirmAdjust,
}: ToolResultRendererProps) {
  if (toolName === "search_datasets" && isCatalogResults(output)) {
    return <DatasetCardList datasets={output} />;
  }

  if (toolName === "confirm_query" && isQueryConfirmation(output)) {
    return (
      <QueryConfirmationCard
        confirmation={output}
        onRun={() => onConfirmRun?.(output)}
        onAdjust={() => onConfirmAdjust?.()}
      />
    );
  }

  if (toolName === "query_dataset" && isQueryResult(output)) {
    return <DataTable result={output} />;
  }

  return null;
}
